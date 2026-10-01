import Link from "next/link";

import { Button } from "@/lib/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-display-lg text-muted-foreground">404</p>
      <h1 className="text-display-sm text-foreground">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="text-body text-muted-foreground">
        주소가 바뀌었거나, 삭제된 페이지일 수 있어요.
      </p>
      <Button asChild className="mt-4">
        <Link href="/">홈으로 돌아가기</Link>
      </Button>
    </main>
  );
}
