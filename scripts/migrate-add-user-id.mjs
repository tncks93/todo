/**
 * One-time migration: assign an owner (`userId`) to documents created before
 * GitHub OAuth login existed.
 *
 *   # 1. Dry run — report only, changes nothing
 *   node --env-file=.env.local scripts/migrate-add-user-id.mjs
 *
 *   # 2. Assign every orphaned document to one user
 *   node --env-file=.env.local scripts/migrate-add-user-id.mjs --user-id <ObjectId>
 *
 * Find your ObjectId by logging in once, then reading the `users` collection.
 *
 * Exits 0 on success, 1 on connection/argument failure.
 */

import mongoose from "mongoose";

// todos/goals have no per-user uniqueness constraint, so a blind updateMany
// is safe. weeklyplans has a compound unique index on {userId, weekStart} —
// blindly assigning every orphan to one user can collide with a plan that
// user already owns for the same week, which crashes updateMany midway and
// leaves the migration partially applied with no way to retry cleanly. So
// weeklyplans is migrated one document at a time with an explicit conflict
// check instead (see migrateWeeklyPlans below).
const BULK_COLLECTIONS = ["todos", "goals"];
const ORPHANED = { userId: { $exists: false } };

function parseUserId(argv) {
  const i = argv.indexOf("--user-id");
  if (i === -1) return null;
  const value = argv[i + 1];
  if (!value || value.startsWith("--")) {
    throw new Error("--user-id requires an ObjectId value");
  }
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`--user-id is not a valid ObjectId: ${value}`);
  }
  return value;
}

/**
 * Assigns `owner` to orphaned weeklyplans one at a time, skipping (and
 * reporting) any orphan whose weekStart the owner already has a plan for —
 * assigning it would collide with the {userId, weekStart} unique index.
 * Safe to re-run: already-assigned docs no longer match ORPHANED, and
 * skipped conflicts are reported again every run until resolved by hand.
 */
async function migrateWeeklyPlans(owner) {
  const col = mongoose.connection.collection("weeklyplans");
  const orphans = await col.find(ORPHANED).toArray();
  let assigned = 0;
  const conflicts = [];

  for (const doc of orphans) {
    const existing = await col.findOne({
      userId: owner,
      weekStart: doc.weekStart,
    });
    if (existing) {
      conflicts.push({ _id: doc._id, weekStart: doc.weekStart });
      continue;
    }
    await col.updateOne({ _id: doc._id }, { $set: { userId: owner } });
    assigned++;
  }

  console.log(`  ${"weeklyplans".padEnd(12)} ${assigned} document(s) updated`);
  if (conflicts.length > 0) {
    console.log(
      `  ${"weeklyplans".padEnd(12)} ${conflicts.length} document(s) SKIPPED (owner already has a plan for that week):`
    );
    for (const c of conflicts) {
      console.log(`    _id=${c._id} weekStart=${c.weekStart.toISOString()}`);
    }
    console.log(
      "    Resolve manually: decide which plan to keep, then delete or re-point the other."
    );
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Run with: node --env-file=.env.local scripts/migrate-add-user-id.mjs"
    );
  }

  const userId = parseUserId(process.argv);

  await mongoose.connect(uri);
  console.log(`Connected to ${mongoose.connection.name}\n`);

  try {
    if (!userId) {
      let total = 0;
      console.log("Dry run — no documents were modified.\n");
      for (const name of [...BULK_COLLECTIONS, "weeklyplans"]) {
        const count = await mongoose.connection
          .collection(name)
          .countDocuments(ORPHANED);
        total += count;
        console.log(`  ${name.padEnd(12)} ${count} document(s) without userId`);
      }
      console.log(`\n  total        ${total}`);
      if (total > 0) {
        console.log(
          "\nRe-run with `--user-id <your-user-objectid>` to assign them to that user."
        );
        console.log(
          "Log in once, then look up your _id in the `users` collection."
        );
      } else {
        console.log("\nNothing to migrate.");
      }
      return;
    }

    const owner = new mongoose.Types.ObjectId(userId);
    console.log(`Assigning orphaned documents to userId ${userId}\n`);
    for (const name of BULK_COLLECTIONS) {
      const res = await mongoose.connection
        .collection(name)
        .updateMany(ORPHANED, { $set: { userId: owner } });
      console.log(`  ${name.padEnd(12)} ${res.modifiedCount} document(s) updated`);
    }
    await migrateWeeklyPlans(owner);
    console.log("\nMigration complete.");
  } finally {
    await mongoose.connection.close();
  }
}

main().catch(async (err) => {
  console.error(`\nMigration failed: ${err.message}`);
  try {
    await mongoose.connection.close();
  } catch {
    /* connection was never opened */
  }
  process.exit(1);
});
