// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username || username.trim().length === 0) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // 사용자 이름 길이 제한
    if (username.length > 20) {
      return NextResponse.json(
        { error: "Username must be 20 characters or less" },
        { status: 400 }
      );
    }

    // 사용자 찾기 또는 생성
    let user = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { username: username.trim() },
      });
    }

    // 간단한 세션 쿠키 설정 (실제 프로덕션에서는 JWT 등 사용)
    cookies().set("userId", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30일
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    );
  }
}
