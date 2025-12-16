import mongoose from "mongoose";

const pageAuditSchema = new mongoose.Schema(
  {
    pageUrl: {
      type: String,
      required: true,
    },
    title: {
      type: String,
    },
    titleLength: {
      type: Number,
    },
    metaDescription: {
      type: String,
    },
    metaLength: {
      type: Number,
    },
    h1Count: {
      type: Number,
    },
    imagesWithoutAlt: {
      type: Number,
    },
  },
  { _id: false }
);

const websiteSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    cms: {
      type: String,
      default: "WordPress",
    },

    httpsEnabled: {
      type: Boolean,
      default: false,
    },

    performanceScore: {
      type: Number,
    },

    auditSummary: {
      totalPages: Number,
      pagesWithIssues: Number,
    },

    pages: [pageAuditSchema],

    lastAuditedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default {};
