// src/inspections/entities/inspection.entity.js

import { EntitySchema } from "typeorm";

export const InspectionEntity = new EntitySchema({
  name: "Inspection",
  tableName: "inspections",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    dealId: {
      type: "uuid",
      nullable: false,
    },
    qoId: {
      type: "uuid",
      nullable: false,
    },

    // ── بيانات التكليف (Assignment) ──
    inspectionLocation: {
      type: "varchar",
      nullable: false,
    },
    requiredDate: {
      type: "date",
      nullable: false,
    },
    status: {
      type: "enum",
      enum: ["assigned", "accepted", "declined", "submitted"],
      default: "assigned",
    },

    // ── بيانات التقرير (Report) - تتعبى لاحقًا ──
    inspectionDate: {
      type: "date",
      nullable: true,
    },
    verifiedQuantity: {
      type: "decimal",
      nullable: true,
    },
    qualityGrade: {
      type: "enum",
      enum: ["A", "B", "C", "fail"],
      nullable: true,
    },
    summary: {
      type: "text",
      nullable: true,
    },
    outcome: {
      type: "enum",
      enum: ["approved", "partially_approved", "rejected"],
      nullable: true,
    },
    submittedAt: {
      type: "timestamp",
      nullable: true,
    },

    createdAt: {
      type: "timestamp",
      createDate: true,
    },
    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
  },
  relations: {
    deal: {
      target: "Deal",
      type: "many-to-one",
      joinColumn: { name: "dealId" },
      onDelete: "CASCADE",
    },
    qo: {
      target: "QualityOfficer",
      type: "many-to-one",
      joinColumn: { name: "qoId" },
      onDelete: "RESTRICT",
    },
    photos: {
      target: "InspectionPhoto",
      type: "one-to-many",
      inverseSide: "inspection",
    },
  },
});