'use strict';

const logger = require('../../shared/utils/logger');
const { THEME } = require('../../shared/utils/uiConstants');

/**
 * Service to handle Employee Exit, Checklist, and Full-and-Final (FnF) Settlements.
 */
const employeeExitService = {
  /**
   * Initiates the exit process for an employee.
   * Sets status to 'notice' and creates the exit record with a checklist.
   */
  async initiateExit(db, employeeId, data, actorId) {
    return await db.$transaction(async (tx) => {
      // 1. Create the exit record
      const exit = await tx.employee_exits.create({
        data: {
          employee_id: employeeId,
          separation_type: data.separationType, // resignation, termination, retirement, absconding
          last_working_date: new Date(data.lastWorkingDate),
          notice_period_days: data.noticePeriodDays || 0,
          notice_served: data.noticeServed || 'full',
          reason: data.reason,
          status: 'initiated',
          created_by: actorId
        }
      });

      // 2. Update employee status to 'notice'
      await tx.employees.update({
        where: { id: employeeId },
        data: { status: 'notice', date_of_leaving: new Date(data.lastWorkingDate) }
      });

      // 3. Initialize exit checklist
      const items = [
        'Asset Return',
        'IT Access Revocation',
        'Knowledge Transfer / Handover',
        'ID Card / Access Card Return',
        'Pending Dues / Reimbursements Clearance'
      ];

      await tx.exit_checklist_items.createMany({
        data: items.map(item => ({
          exit_id: exit.id,
          item_name: item,
          completed: false
        }))
      });

      logger.info(`${THEME.ICONS.USER} Exit initiated for Employee ID: ${employeeId}`);
      return exit;
    });
  },

  /**
   * Calculates the projected FnF dues.
   * Logic: Unpaid Salary + Leave Encashment + Gratuity - Recoveries.
   */
  async calculateFnF(db, employeeId) {
    const employee = await db.employees.findUnique({
      where: { id: employeeId },
      include: {
        employee_salaries: { where: { effective_to: null }, take: 1 },
        leave_balances: { include: { leave_type: true } },
        employee_exits: { where: { status: { not: 'completed' } }, take: 1 }
      }
    });

    if (!employee || !employee.employee_exits[0]) {
      throw new Error('No active exit process found for this employee');
    }

    const salary = employee.employee_salaries[0];
    const exit = employee.employee_exits[0];
    const lwd = new Date(exit.last_working_date);
    
    // 1. Calculate days worked in the final month
    const firstOfMonth = new Date(lwd.getFullYear(), lwd.getMonth(), 1);
    const daysWorked = lwd.getDate(); 
    const totalDaysInMonth = new Date(lwd.getFullYear(), lwd.getMonth() + 1, 0).getDate();

    // 2. Pro-rata Salary (Basic + DA)
    const monthlyBasic = (salary.basic || 0);
    const unpaidSalary = Math.round((monthlyBasic / totalDaysInMonth) * daysWorked);

    // 3. Leave Encashment (Basic / 30 * earned_leave_balance)
    const elBalance = employee.leave_balances.find(b => b.leave_type.code === 'EL' || b.leave_type.name.includes('Earned'))?.closing_balance || 0;
    const leaveEncashment = Math.round((monthlyBasic / 30) * elBalance);

    // 4. Gratuity (Simplified: 15 days of basic per year if service > 5 years)
    let gratuity = 0;
    const doj = new Date(employee.date_of_joining);
    const yearsOfService = (lwd - doj) / (1000 * 60 * 60 * 24 * 365.25);
    if (yearsOfService >= 4.8) { // Rounded to 5 for eligibility
      gratuity = Math.round((monthlyBasic / 26) * 15 * yearsOfService);
    }

    return {
      employeeId,
      lastWorkingDate: exit.last_working_date,
      earnings: {
        unpaidSalary,
        leaveEncashment,
        gratuity
      },
      recoveries: {
        noticeRecovery: 0, // Logic for notice shortfall can be added here
        assetDamage: 0
      },
      totalPayable: unpaidSalary + leaveEncashment + gratuity
    };
  },

  /**
   * Finalizes the settlement and terminates the employee.
   */
  async processSettlement(db, employeeId, settlementData, actorId) {
    return await db.$transaction(async (tx) => {
      const exit = await tx.employee_exits.findFirst({
        where: { employee_id: employeeId, status: { not: 'completed' } }
      });

      // 1. Create settlement record
      await tx.fnf_settlements.create({
        data: {
          employee_id: employeeId,
          exit_id: exit.id,
          ...settlementData,
          processed_by: actorId
        }
      });

      // 2. Mark employee as terminated and disable login
      await tx.employees.update({
        where: { id: employeeId },
        data: { status: 'terminated' }
      });

      await tx.users.updateMany({
        where: { employee_id: employeeId },
        data: { is_active: false }
      });

      await tx.employee_exits.update({
        where: { id: exit.id },
        data: { status: 'completed', fnf_processed: true }
      });

      logger.info(`${THEME.ICONS.LOCK} FnF Settlement finalized for Employee ID: ${employeeId}`);
    });
  }
};

module.exports = employeeExitService;