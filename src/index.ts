import { Hono } from 'hono'
import { serve } from '@hono/node-server'

import onError from "stoker/middlewares/on-error";
import notFound from "stoker/middlewares/not-found";

import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

import { categoryRoutes } from './routes/categories'
import { taskRoutes } from './routes/tasks'


const app = new Hono();

app.use('*', logger()); // simple logger to CLI
app.use('*', prettyJSON()); // formatted JSON responses when appending ?pretty to the URL

app.route('/categories', categoryRoutes);
app.route('/tasks', taskRoutes);

// these default handlers only handle _routes_ that are not found, and uncaught exceptions
// we still need to handle cases like where we don't find an object in the db ourselves
app.notFound(notFound);
app.onError(onError);

serve({ fetch: app.fetch, port: 3000 });