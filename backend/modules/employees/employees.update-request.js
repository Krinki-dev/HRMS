const { sendSuccess, sendError, ERROR_CODES } = require('../../shared/utils/response');

exports.submit = async (req, res) => {
  try {
    const db          = req.db;
    const { id: employeeId } = req.params;
    const requestedBy = req.user.id;
    const companyId   = req.user.tenantId;

    const emp = await db.employees.findFirst({
      where:  { id: employeeId, company_id: companyId, deleted_at: null },
      select: { id: true, first_name: true, last_name: true, employee_code: true },
    });
    if (!emp) return sendError(res, ERROR_CODES.NOT_FOUND, 'Employee not found.', 404);

    await db.audit_logs.create({
      data: {
        company_id:  companyId,
        user_id:     requestedBy,
        module:      'employees',
        action:      'update_request',
        record_id:   employeeId,
        record_type: 'employee',
        new_values:  JSON.stringify({
          ...req.body,
          _meta: {
            requestedBy,
            employeeName: `${emp.first_name} ${emp.last_name}`,
            employeeCode: emp.employee_code,
            submittedAt:  new Date().toISOString(),
            status:       'pending',
          },
        }),
        ip_address: req.ip || null,
      },
    });

    return sendSuccess(res, null, 'Update request submitted. HR will review and apply changes.');
  } catch (e) {
    console.error('[UpdateRequest.submit]', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to submit request.', 500);
  }
};

exports.listPending = async (req, res) => {
  try {
    const db        = req.db;
    const companyId = req.user.tenantId;

    const rows = await db.audit_logs.findMany({
      where: {
        company_id: companyId,
        module:     'employees',
        action:     'update_request',
      },
      orderBy: { created_at: 'desc' },
      take:    50,
    });

    const requests = rows.map(r => {
      const data = (() => { try { return JSON.parse(r.new_values || '{}'); } catch { return {}; } })();
      return {
        requestId:    r.id,
        employeeId:   r.record_id,
        requestedBy:  r.user_id,
        submittedAt:  r.created_at,
        employeeName: data._meta?.employeeName || 'Unknown',
        employeeCode: data._meta?.employeeCode || '',
        status:       data._meta?.status       || 'pending',
        changes:      data,
      };
    });

    return sendSuccess(res, requests);
  } catch (e) {
    console.error('[UpdateRequest.listPending]', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to load requests.', 500);
  }
};

exports.approve = async (req, res) => {
  try {
    const db            = req.db;
    const { requestId } = req.params;
    const companyId     = req.user.tenantId;

    const logEntry = await db.audit_logs.findFirst({
      where: { id: requestId, company_id: companyId, action: 'update_request' },
    });
    if (!logEntry) return sendError(res, ERROR_CODES.NOT_FOUND, 'Request not found.', 404);

    const data       = (() => { try { return JSON.parse(logEntry.new_values || '{}'); } catch { return {}; } })();
    const employeeId = logEntry.record_id;

    const { _meta, personal, ...rest } = data;
    const updateData = personal || rest;

    if (updateData && Object.keys(updateData).length > 0) {
      await db.employees.updateMany({
        where: { id: employeeId, company_id: companyId },
        data: {
          ...(updateData.firstName   !== undefined && { first_name:    updateData.firstName }),
          ...(updateData.lastName    !== undefined && { last_name:     updateData.lastName }),
          ...(updateData.middleName  !== undefined && { middle_name:   updateData.middleName }),
          ...(updateData.fatherName  !== undefined && { father_name:   updateData.fatherName }),
          ...(updateData.motherName  !== undefined && { mother_name:   updateData.motherName }),
          ...(updateData.spouseName  !== undefined && { spouse_name:   updateData.spouseName }),
          ...(updateData.phone       !== undefined && { phone:         updateData.phone }),
          ...(updateData.personalEmail !== undefined && { personal_email: updateData.personalEmail }),
          ...(updateData.emergencyContactName  !== undefined && { emergency_contact_name:  updateData.emergencyContactName }),
          ...(updateData.emergencyContactPhone !== undefined && { emergency_contact_phone: updateData.emergencyContactPhone }),
          ...(updateData.emergencyContactRel   !== undefined && { emergency_contact_rel:   updateData.emergencyContactRel }),
        },
      });
    }

    const updated = JSON.stringify({
      ...data,
      _meta: {
        ...(data._meta || {}),
        status:     'approved',
        approvedBy: req.user.id,
        approvedAt: new Date().toISOString(),
      },
    });

    await db.audit_logs.update({
      where: { id: requestId },
      data:  { new_values: updated, action: 'update_approved' },
    });

    return sendSuccess(res, null, 'Update request approved and applied.');
  } catch (e) {
    console.error('[UpdateRequest.approve]', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to approve.', 500);
  }
};

exports.reject = async (req, res) => {
  try {
    const db            = req.db;
    const { requestId } = req.params;
    const companyId     = req.user.tenantId;

    const logEntry = await db.audit_logs.findFirst({
      where: { id: requestId, company_id: companyId, action: 'update_request' },
    });
    if (!logEntry) return sendError(res, ERROR_CODES.NOT_FOUND, 'Request not found.', 404);

    const data    = (() => { try { return JSON.parse(logEntry.new_values || '{}'); } catch { return {}; } })();
    const updated = JSON.stringify({
      ...data,
      _meta: {
        ...(data._meta || {}),
        status:     'rejected',
        rejectedBy: req.user.id,
        rejectedAt: new Date().toISOString(),
        reason:     req.body.reason || '',
      },
    });

    await db.audit_logs.update({
      where: { id: requestId },
      data:  { new_values: updated, action: 'update_rejected' },
    });

    return sendSuccess(res, null, 'Request rejected.');
  } catch (e) {
    console.error('[UpdateRequest.reject]', e.message);
    return sendError(res, ERROR_CODES.SERVER, e.message || 'Failed to reject.', 500);
  }
};

