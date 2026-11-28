'use strict';

const clients = new Map();
const socketIdentity = new WeakMap();

function removeSocket(userId, ws) {
  const sockets = clients.get(userId);
  if (!sockets) return;
  sockets.delete(ws);
  socketIdentity.delete(ws);
  if (sockets.size === 0) clients.delete(userId);
}

const register = (identity, ws) => {
  if (!identity || ![identity.userId, identity.tenantId, identity.companyId]
    .every((value) => typeof value === 'string' && value.trim())) {
    throw new TypeError('Verified WebSocket user, tenant and company identity are required.');
  }
  if (!ws || typeof ws.on !== 'function') {
    throw new TypeError('A valid WebSocket connection is required.');
  }

  const normalizedIdentity = Object.freeze({
    userId: identity.userId,
    tenantId: identity.tenantId || null,
    companyId: identity.companyId || null,
  });

  if (!clients.has(normalizedIdentity.userId)) clients.set(normalizedIdentity.userId, new Set());
  clients.get(normalizedIdentity.userId).add(ws);
  socketIdentity.set(ws, normalizedIdentity);

  ws.on('close', () => removeSocket(normalizedIdentity.userId, ws));
  ws.on('error', () => removeSocket(normalizedIdentity.userId, ws));
};

const pushToUser = (userId, payload, tenantId, companyId) => {
  // Do not emit cross-workspace user notifications when the caller cannot
  // provide the same verified identity tuple used at socket registration.
  if (!tenantId || !companyId) return;
  const sockets = clients.get(userId);
  if (!sockets) return;
  const msg = JSON.stringify(payload);
  sockets.forEach((ws) => {
    const identity = socketIdentity.get(ws);
    if (identity?.tenantId !== tenantId || identity?.companyId !== companyId) return;
    try { if (ws.readyState === 1) ws.send(msg); } catch (_) {}
  });
};

const pushToCompany = (tenantId, companyId, payload) => {
  // Missing tenant context must fail closed, never become a global broadcast.
  if (!tenantId || !companyId) return;
  const msg = JSON.stringify({ ...payload, _broadcast: true });
  clients.forEach((sockets) => {
    sockets.forEach((ws) => {
      const identity = socketIdentity.get(ws);
      if (identity?.tenantId !== tenantId || identity?.companyId !== companyId) return;
      try { if (ws.readyState === 1) ws.send(msg); } catch (_) {}
    });
  });
};

const create = async (db, companyId, { userIds, type, title, body, link, priority = 'normal' }, tenantId = null) => {
  const announcement = await db.announcements.create({
    data: {
      company_id: companyId,
      title,
      body,
      type,
      priority,
      audience_type: userIds?.length ? 'specific' : 'all',
      audience_ids: JSON.stringify(userIds || []),
      notify_inapp: true,
    },
  });

  const targets = userIds?.length ? userIds : [];
  const wsPayload = {
    id: announcement.id,
    type,
    title,
    body,
    link,
    priority,
    created_at: announcement.created_at,
  };

  if (targets.length) {
    targets.forEach((uid) => pushToUser(uid, wsPayload, tenantId, companyId));
  } else {
    pushToCompany(tenantId, companyId, wsPayload);
  }

  return announcement;
};

const list = async (db, companyId, userId, query = {}) => {
  const { limit = 20, cursor } = query;
  const take = Math.min(parseInt(limit, 10) || 20, 50);
  const where = {
    company_id: companyId,
    OR: [
      { audience_type: 'all' },
      { audience_ids: { contains: userId } },
    ],
  };

  const items = await db.announcements.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      title: true,
      body: true,
      type: true,
      priority: true,
      is_pinned: true,
      created_at: true,
      reads: { where: { user_id: userId }, select: { read_at: true } },
    },
  });

  const hasMore = items.length > take;
  const data = items.slice(0, take).map((n) => ({
    ...n,
    is_read: n.reads.length > 0,
    read_at: n.reads[0]?.read_at || null,
    reads: undefined,
  }));

  return {
    data,
    pagination: {
      hasMore,
      nextCursor: hasMore ? data[data.length - 1]?.id : null,
      count: data.length,
    },
  };
};

const unreadCount = async (db, companyId, userId) => {
  const total = await db.announcements.count({
    where: {
      company_id: companyId,
      notify_inapp: true,
      OR: [
        { audience_type: 'all' },
        { audience_ids: { contains: userId } },
      ],
      NOT: { reads: { some: { user_id: userId } } },
    },
  });
  return { count: total };
};

const markRead = async (db, notificationId, userId) => {
  await db.announcement_reads.upsert({
    where: { announcement_id_user_id: { announcement_id: notificationId, user_id: userId } },
    create: { announcement_id: notificationId, user_id: userId },
    update: { read_at: new Date() },
  });
  return { success: true };
};

const markAllRead = async (db, companyId, userId) => {
  const unread = await db.announcements.findMany({
    where: {
      company_id: companyId,
      notify_inapp: true,
      OR: [
        { audience_type: 'all' },
        { audience_ids: { contains: userId } },
      ],
      NOT: { reads: { some: { user_id: userId } } },
    },
    select: { id: true },
  });

  await db.announcement_reads.createMany({
    data: unread.map((n) => ({ announcement_id: n.id, user_id: userId })),
    skipDuplicates: true,
  });

  return { marked: unread.length };
};

module.exports = {
  register,
  pushToUser,
  pushToCompany,
  create,
  list,
  unreadCount,
  markRead,
  markAllRead,
};
