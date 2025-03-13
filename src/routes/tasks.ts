import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";



const taskRoutes = new Hono();

taskRoutes.get('/',
  async (c) => {

  });

taskRoutes.post('/',
  async (c) => {

  });

taskRoutes.put('/:id',
  async (c) => {

  });

taskRoutes.delete('/:id',
  async (c) => {

  });

export { taskRoutes };
