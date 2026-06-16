/**
 * Standard pricing for HRMS modules in Paise (100 Paise = 1 INR).
 * Based on market research midpoints.
 */
module.exports = {
  // Per Employee Per Month
  payroll:     { price: 3000, type: 'per_employee' }, // ₹30
  compliance:  { price: 1800, type: 'per_employee' }, // ₹18
  fieldforce:  { price: 2500, type: 'per_employee' }, // ₹25

  // Flat Fee Per Month
  recruitment: { price: 120000, type: 'flat' },        // ₹1,200
  performance: { price: 90000, type: 'flat' },         // ₹900
  training:    { price: 70000, type: 'flat' },         // ₹700
  expenses:    { price: 60000, type: 'flat' },         // ₹600
  ai:          { price: 75000, type: 'flat' },         // ₹750
};

