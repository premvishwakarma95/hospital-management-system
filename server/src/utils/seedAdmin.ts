import { User } from "../models/User";

export const seedAdminIfEmpty = async (): Promise<void> => {
  const adminCount = await User.countDocuments({ role: "admin" });
  if (adminCount > 0) return;

  const email = process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;
  const name = process.env.DEFAULT_ADMIN_NAME || "System Administrator";

  if (!email || !password) {
    console.warn(
      "⚠️  No admin user exists. Set DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD in .env to auto-create the first admin."
    );
    return;
  }

  await User.create({ name, email, password, role: "admin" });
  console.log(`✓ First admin created: ${email}`);
};
