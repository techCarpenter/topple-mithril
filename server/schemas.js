const errorSchema = {
  type: "object",
  required: ["msg"],
  properties: {
    msg: { type: "string" }
  }
};

const timestampSchema = {
  type: "integer",
  description: "Unix timestamp in milliseconds"
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
    name: { type: "string" },
    provider: { type: "string" },
    apr: { type: "number" },
    minPayment: { type: "number" }
  }
};

const loanInputSchema = {
  type: "object",
  required: ["name", "apr", "minPayment"],
  properties: {
    name: { type: "string" },
    provider: { type: "string" },
    apr: { type: "number" },
    minPayment: { type: "number" }
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
    accountId: { type: "integer" },
    date: timestampSchema,
    balance: { type: "number" }
  }
};

const snapshotInputSchema = {
  type: "object",
  required: ["accountId", "date", "balance"],
  properties: {
    accountId: { type: "integer" },
    date: timestampSchema,
    balance: { type: "number" }
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
    date: timestampSchema,
    amount: { type: "number" }
  }
};

const extraPaymentInputSchema = {
  type: "object",
  required: ["date", "amount"],
  properties: {
    date: timestampSchema,
    amount: { type: "number" }
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
    date: timestampSchema,
    amount: { type: "number" }
  }
};

const snowballAdjustmentInputSchema = {
  type: "object",
  required: ["date", "amount"],
  properties: {
    date: timestampSchema,
    amount: { type: "number" }
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
  timestampSchema,
  userListSchema,
  userSchema
};
