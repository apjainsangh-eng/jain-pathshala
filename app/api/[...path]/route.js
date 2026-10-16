import { matchRoute } from '@/lib/server/routes';
import { authenticate } from '@/lib/server/auth';
import { getGlobalCollection } from '@/lib/server/db';
import { runWithPathshala, isPathshalaActive, isAdminOf, isStudentActive } from '@/lib/server/tenant';

const INACTIVE_MESSAGE = "This account is inactive, so attendance and gatha can't be added. Please ask your pathshala admin to make you active.";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The controllers were written for Express. This builds the small slice of
// req/res they use (body, params, query, headers, user / status, json, send, setHeader).
function createResponse() {
  let status = 200;
  let body = null;
  const headers = new Headers();
  let sent = false;
  const done = () => { sent = true; };

  const res = {
    status(code) { status = code; return res; },
    setHeader(name, value) { headers.set(name, value); return res; },
    header(name, value) { headers.set(name, value); return res; },
    json(data) {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(data);
      done();
      return res;
    },
    send(data) {
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'text/plain; charset=utf-8');
      body = typeof data === 'string' ? data : JSON.stringify(data);
      done();
      return res;
    },
    end() { done(); return res; },
  };

  return { res, isSent: () => sent, toResponse: () => new Response(body, { status, headers }) };
}

async function handle(request, { params }) {
  const { path = [] } = await params;
  const match = matchRoute(request.method, path);
  if (!match) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers);
  let body = {};
  if (request.method !== 'GET' && request.method !== 'DELETE') {
    body = await request.json().catch(() => ({}));
  }

  const req = {
    method: request.method,
    headers,
    params: match.params,
    query: Object.fromEntries(url.searchParams),
    body,
    user: null,
  };

  const { access } = match.route;
  let pathshalaId = null;

  if (access === 'user' || access === 'superadmin') {
    let result;
    try {
      result = authenticate(req);
    } catch (error) {
      console.error(error);
      return Response.json({ error: 'Server is not configured' }, { status: 500 });
    }
    if (!result.user) return Response.json({ error: result.error }, { status: result.status });
    req.user = result.user;

    if (access === 'superadmin') {
      if (req.user.role !== 'superadmin') return Response.json({ error: 'Super admin only' }, { status: 403 });
    } else {
      // Every student/admin token is bound to one pathshala; all their data access is scoped to it
      pathshalaId = req.user.pathshalaId;
      if (!pathshalaId) return Response.json({ error: 'Invalid token' }, { status: 401 });
      if (!(await isPathshalaActive(pathshalaId, getGlobalCollection))) {
        return Response.json({ error: 'This pathshala is not active' }, { status: 401 });
      }
      // Admins may have been removed from this pathshala (or disabled) since they logged in.
      // Super admin "open admin panel" tokens are exempt.
      if (req.user.role === 'admin' && !req.user.impersonatedBy
          && !(await isAdminOf(req.user.id, pathshalaId, getGlobalCollection))) {
        return Response.json({ error: 'You are no longer an admin of this pathshala' }, { status: 401 });
      }
      // Inactive students can log in and look around, but not add attendance or gatha
      // (for themselves, or a family member acting for them)
      if (req.user.role === 'student' && match.route.blockInactive) {
        const target = String(body.forUsername || req.user.username);
        if (!(await isStudentActive(target, pathshalaId, getGlobalCollection))) {
          return Response.json({ error: INACTIVE_MESSAGE, inactive: true }, { status: 403 });
        }
      }
    }
  }

  const { res, isSent, toResponse } = createResponse();
  try {
    const run = () => match.route.handler(req, res);
    await (pathshalaId ? runWithPathshala(pathshalaId, run) : run());
    if (!isSent()) throw new Error('Handler returned without responding');
  } catch (error) {
    console.error(`${request.method} /api/${path.join('/')} failed:`, error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
  return toResponse();
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
