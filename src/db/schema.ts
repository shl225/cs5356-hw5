import { z } from 'zod';
import { createSchemaFactory } from 'drizzle-zod';

// Define the DB schema first...

import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';


export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  dueDate: timestamp('due_date'),
  completed: boolean('completed').default(false),
  categoryId: integer('category_id').references(() => categoriesTable.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// explicitly define the relations between the tables...

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  tasks: many(tasksTable),
}));

export const tasksRelations = relations(tasksTable, ({ one }) => ({
  category: one(categoriesTable, {
    fields: [tasksTable.categoryId],
    references: [categoriesTable.id],
  }),
}));

// ... then derive the zod schemas from the DB schema

const { createInsertSchema, createSelectSchema, createUpdateSchema } = createSchemaFactory({
  coerce: { 
    number: true, // coerce ID strings (from params) to numbers (for DB)
    date: true    // coerce date strings (e.g. Task due dates) to Date objects
  }
});

// Which fields are required for inserting into the DB?
// We omit `id` & `createdAt`; fields the db creates automatically
// We _could_ allow specifying them in inserts or updates, that depends on the business logic
// `status` and `priority` have defauls in the db, for example, but we do allow specifying them
const generatedFields = {
  id: true,
  createdAt: true,
} as const;

export const categoryInsertSchema = createInsertSchema(categoriesTable).omit(generatedFields);
export const categorySelectSchema = createSelectSchema(categoriesTable) // no omit here as those are the fields we get back from the db
export const categoryUpdateSchema = createUpdateSchema(categoriesTable).omit(generatedFields);

export const taskInsertSchema = createInsertSchema(tasksTable).omit(generatedFields);
export const taskSelectSchema = createSelectSchema(tasksTable) // see above
export const taskUpdateSchema = createUpdateSchema(tasksTable).omit(generatedFields);

// derive typescript types from the derived zod schemas
export type CategoryInsert = z.infer<typeof categoryInsertSchema>;
export type CategorySelect = z.infer<typeof categorySelectSchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;

export type TaskInsert = z.infer<typeof taskInsertSchema>;
export type TaskSelect = z.infer<typeof taskSelectSchema>;
export type TaskUpdate = z.infer<typeof taskUpdateSchema>;

// Finally, we also want to validate the params of our routes
// The IDs in our routes are integers, but they could be UUIDs, etc)
// we could pick the id field from the DB schema…
// export const idSchema = categorySelectSchema.pick({ id: true });
// 
// … but here it may be clearer to write a new schema, 
// coerce, as it's an integer in the DB but a string in the params
export const paramsIDSchema = z.object({ id: z.coerce.number() });
