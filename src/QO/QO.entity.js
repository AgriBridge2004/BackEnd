import { EntitySchema } from "typeorm";

export const QualityOfficerEntity = new EntitySchema({
  name: "QualityOfficer",
  tableName: "quality_officers",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    userId: {
      type: "uuid",
      nullable: false,
    },
    fullName: {
      type: "varchar",
      nullable: false,
    },
    phone: {
      type: "varchar",
      nullable: true,
    },
    region: {
      type: "varchar",
      nullable: true,
    },
    status: {
      type: "enum",
      enum: ["available", "busy", "on_leave"],
      default: "available",
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
    user: {
      target: "User",
      type: "many-to-one",
      joinColumn: { name: "userId" },
      onDelete: "CASCADE",
    },
    // inspections: {
    //   target: "Inspection",
    //   type: "one-to-many",
    //   inverseSide: "qo",
    // },
  },
});