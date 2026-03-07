/**
 * Migration Script: Hash all plaintext passwords in the database
 * 
 * Run once: npx tsx scripts/hash-passwords.ts
 * 
 * Safe to run multiple times — skips users already hashed (password starts with $2)
 */

import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function hashExistingPasswords() {
    console.log("🔐 Starting password hashing migration...\n");

    const users = await prisma.user.findMany({
        select: { id: true, name: true, password: true }
    });

    let skipped = 0;
    let hashed = 0;
    let failed = 0;

    for (const user of users) {
        // Skip already hashed passwords
        if (user.password.startsWith("$2")) {
            console.log(`  ⏭️  Skipped (already hashed): ${user.name}`);
            skipped++;
            continue;
        }

        try {
            const hashedPassword = await bcrypt.hash(user.password, 12);
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });
            console.log(`  ✅ Hashed: ${user.name}`);
            hashed++;
        } catch (err) {
            console.error(`  ❌ Failed: ${user.name}`, err);
            failed++;
        }
    }

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Hashed:  ${hashed} users
⏭️  Skipped: ${skipped} users (already hashed)
❌ Failed:  ${failed} users
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

    await prisma.$disconnect();
}

hashExistingPasswords().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
