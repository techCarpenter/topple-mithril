const errorSchema = {
  type: "object",
  required: ["msg"],
  properties: {
    msg: { type: "string" }
  }
};

const dateSchema = {
  type: "string",
  format: "date",
  pattern: "^\\d{4}-\\d{2}-\\d{2}$",
  description: "Local calendar date in YYYY-MM-DD format"
};

const idParamSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "integer" }
  }
};

const loanSchema = {
  type: "object",
  required: ["id", "userId", "name", "provider", "apr", "minPayment"],
  properties: {
    id: { type: "integer" },
    userId: { type: "integer" },
    name: { type: "string", minLength: 1, maxLength: 120 },
    provider: { type: "string", maxLength: 120 },
    apr: { type: "number", minimum: 0, maximum: 1000 },
    minPayment: { type: "number", exclusiveMinimum: 0 }
  }
};

const loanInputSchema = {
  type: "object",
  required: ["name", "apr", "minPayment"],
  properties: {
    name: { type: "string", minLength: 1, maxLength: 120 },
    provider: { type: "string", maxLength: 120 },
    apr: { type: "number", minimum: 0, maximum: 1000 },
    minPayment: { type: "number", exclusiveMinimum: 0 }
  }
};

const loanListSchema = {
  type: "array",
  items: loanSchema
};

const createLoanBodySchema = {
  oneOf: [
    loanInputSchema,
    {
      type: "array",
      minItems: 1,
      items: loanInputSchema
    }
  ]
};

const createLoanResponseSchema = {
  oneOf: [
    loanSchema,
    loanListSchema
  ]
};

const userSchema = {
  type: "object",
  required: ["id", "name", "username", "email"],
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    username: { type: "string" },
    email: { type: "string" }
  }
};

const userListSchema = {
  type: "array",
  items: userSchema
};

const apiIndexSchema = {
  type: "object",
  required: ["name", "docs", "routes"],
  properties: {
    name: { type: "string" },
    docs: { type: "string" },
    routes: {
      type: "object",
      required: ["users", "loans", "snapshots", "extraPayments", "snowballAdjustments"],
      properties: {
        users: { type: "string" },
        loans: { type: "string" },
        snapshots: { type: "string" },
        extraPayments: { type: "string" },
        snowballAdjustments: { type: "string" }
      }
    }
  }
};

const snapshotSchema = {
  type: "object",
  required: ["id", "userId", "accountId", "date", "balance"],
  properties: {
    id: { type: "integer" },
    userId: { type: "integer" },
    accountId: { type: "integer", minimum: 1 },
    date: dateSchema,
    balance: { type: "number", minimum: 0 }
  }
};

const snapshotInputSchema = {
  type: "object",
  required: ["accountId", "date", "balance"],
  properties: {
    accountId: { type: "integer", minimum: 1 },
    date: dateSchema,
    balance: { type: "number", minimum: 0 }
  }
};

const snapshotListSchema = {
  type: "array",
  items: snapshotSchema
};

const createSnapshotBodySchema = {
  oneOf: [
    snapshotInputSchema,
    {
      type: "array",
      minItems: 1,
      items: snapshotInputSchema
    }
  ]
};

const createSnapshotResponseSchema = {
  oneOf: [
    snapshotSchema,
    snapshotListSchema
  ]
};

const extraPaymentSchema = {
  type: "object",
  required: ["id", "userId", "date", "amount"],
  properties: {
    id: { type: "integer" },
    userId: { type: "integer" },
    date: dateSchema,
    amount: { type: "number", minimum: 0 }
  }
};

const extraPaymentInputSchema = {
  type: "object",
  required: ["date", "amount"],
  properties: {
    date: dateSchema,
    amount: { type: "number", minimum: 0 }
  }
};

const extraPaymentListSchema = {
  type: "array",
  items: extraPaymentSchema
};

const createExtraPaymentBodySchema = {
  oneOf: [
    extraPaymentInputSchema,
    {
      type: "array",
      minItems: 1,
      items: extraPaymentInputSchema
    }
  ]
};

const createExtraPaymentResponseSchema = {
  oneOf: [
    extraPaymentSchema,
    extraPaymentListSchema
  ]
};

const snowballAdjustmentSchema = {
  type: "object",
  required: ["id", "userId", "date", "amount"],
  properties: {
    id: { type: "integer" },
    userId: { type: "integer" },
    date: dateSchema,
    amount: { type: "number", minimum: 0 }
  }
};

const snowballAdjustmentInputSchema = {
  type: "object",
  required: ["date", "amount"],
  properties: {
    date: dateSchema,
    amount: { type: "number", minimum: 0 }
  }
};

const snowballAdjustmentListSchema = {
  type: "array",
  items: snowballAdjustmentSchema
};

const createSnowballAdjustmentBodySchema = {
  oneOf: [
    snowballAdjustmentInputSchema,
    {
      type: "array",
      minItems: 1,
      items: snowballAdjustmentInputSchema
    }
  ]
};

const createSnowballAdjustmentResponseSchema = {
  oneOf: [
    snowballAdjustmentSchema,
    snowballAdjustmentListSchema
  ]
};

export {
  apiIndexSchema,
  createExtraPaymentBodySchema,
  createExtraPaymentResponseSchema,
  createLoanBodySchema,
  createLoanResponseSchema,
  createSnapshotBodySchema,
  createSnapshotResponseSchema,
  createSnowballAdjustmentBodySchema,
  createSnowballAdjustmentResponseSchema,
  errorSchema,
  extraPaymentInputSchema,
  extraPaymentListSchema,
  extraPaymentSchema,
  idParamSchema,
  loanInputSchema,
  loanListSchema,
  loanSchema,
  snapshotInputSchema,
  snapshotListSchema,
  snapshotSchema,
  snowballAdjustmentInputSchema,
  snowballAdjustmentListSchema,
  snowballAdjustmentSchema,
  dateSchema,
  userListSchema,
  userSchema
};
