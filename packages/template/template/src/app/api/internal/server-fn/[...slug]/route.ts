import { handleServerFnPost } from '@/lib/server-action/handler'

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string[] }> },
): Promise<Response> {
  const { slug } = await context.params
  return handleServerFnPost(request, slug)
}
