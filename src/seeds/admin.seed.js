import bcrypt from "bcrypt";
import { AppDataSource } from "../config/database.js";
import { UserEntity } from "../users/user.entity.js";

await AppDataSource.initialize();

const repo = AppDataSource.getRepository("User");

const admin = repo.create({
    email: "admin@example.com",
    password: await bcrypt.hash("12345678", 10),
    role: "admin",
});

await repo.save(admin);

console.log("Admin created");
process.exit();