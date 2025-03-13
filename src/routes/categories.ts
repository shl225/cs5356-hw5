import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import { db } from '../db';
import { eq } from 'drizzle-orm';
import { DatabaseError } from 'pg';

import { 
  categoriesTable, 
  categoryInsertSchema, 
  categoryUpdateSchema, 

  CategoryInsert,
  CategorySelect,
  CategoryUpdate,

  paramsIDSchema,
} from '../db/schema';


const categoryRoutes = new Hono();

categoryRoutes.get('/',
  async (c) => {

    const result: CategorySelect[] = await db.query.categoriesTable.findMany();
    return c.json({ categories: result });
  });

categoryRoutes.get('/:id',
  zValidator('param', paramsIDSchema),
  async (c) => {

    const { id } = c.req.valid('param');
    const result: CategorySelect | undefined = await db.query.categoriesTable.findFirst({
      where: eq(categoriesTable.id, id),
      with: { tasks: true },
    });
    return c.json({ category: result });
  });

categoryRoutes.post('/',
  zValidator('json', categoryInsertSchema),
  async (c) => {

    // in this handler we explicitly destructure validated data from the request body
    const data = c.req.valid('json');
    const { name, notes }: CategoryInsert = data;
    const [result] = await db.insert(categoriesTable)
      .values({ name, notes })
      .returning();
    return c.json({ category: result }, HttpStatusCodes.CREATED);
  });

categoryRoutes.put('/:id',
  zValidator('param', paramsIDSchema),
  zValidator('json', categoryUpdateSchema),
  async (c) => {

    // in this handler we use the zod schema to do the validation
    // and automatically extract the data from the request
    // when we change the categoryUpdateSchema, we won't need to change this handler
    // but will alter which fields are allowed to update
    const { id } = c.req.valid('param');
    const updateData: CategoryUpdate = c.req.valid('json');

    if (Object.keys(updateData).length === 0) {
      return c.json({ message: HttpStatusPhrases.UNPROCESSABLE_ENTITY }, HttpStatusCodes.UNPROCESSABLE_ENTITY);
    }

    const [result] = await db.update(categoriesTable)
      .set(updateData)
      .where(eq(categoriesTable.id, id))
      .returning();

    if (!result) {
      return c.json({ message: HttpStatusPhrases.NOT_FOUND }, HttpStatusCodes.NOT_FOUND);
    }

    return c.json({ category: result }, HttpStatusCodes.OK);
  });

categoryRoutes.delete('/:id',
  zValidator('param', paramsIDSchema),
  async (c) => {

    const { id } = c.req.valid('param');
    const deleted: CategorySelect[] = await db.delete(categoriesTable).where(eq(categoriesTable.id, id)).returning();

    if (deleted.length === 0) {
      return c.json({
        message: HttpStatusPhrases.NOT_FOUND,
      }, HttpStatusCodes.NOT_FOUND);
    }
    
    return c.body(null, HttpStatusCodes.NO_CONTENT);
  });

export { categoryRoutes };
