import { EntitySchema } from "typeorm";

export const FarmerEntity = new EntitySchema({
  name: "Farmer",
  tableName: "farmers",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    fullName: {
      type: "varchar",
    },
    phone: {
      type: "varchar",
    },
    farmName: {
      type: "varchar",
      nullable: true,
    },
    bio: {
      type: "text",
      nullable: true,
    },
    region: {
      type: "varchar",
      nullable: true,
    },
    farmSize: {
      type: "float",
      nullable: true,
    },
    // صورة شخصية
    profileImage: {
      type: "varchar",
      nullable: true,
    },
    // صورة غلاف
    coverImage: {
      type: "varchar",
      nullable: true,
    },
    // ─── Extra Fields ───────────────────────────────
    specialties: {
      type: "simple-array",
      nullable: true,
    },
    certifications: {
      type: "simple-array",
      nullable: true,
    },
    businessLicense: {
      type: "varchar",
      nullable: true,
    },
    isVerified: {
      type: "boolean",
      default: false,
    },
    // ────────────────────────────────────────────────
    userId: {
      type: "uuid",
      nullable: true,
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
    },
  },
  relations: {
    user: {
      target: "User",
      type: "one-to-one",
      joinColumn: true,
      cascade: true,
      onDelete: "CASCADE",
    },
  },
});