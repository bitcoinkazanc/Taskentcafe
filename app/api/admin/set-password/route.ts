import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL eksik."
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY eksik."
  );
}

const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST() {
  try {
    const authUserId =
      "f967a709-2e97-42ef-a076-99b72e65e1df";

    const newPassword =
      "taskentcafE47**";

    const {
      data,
      error,
    } =
      await supabaseAdmin.auth.admin.updateUserById(
        authUserId,
        {
          password: newPassword,
          email: "sezai_atli@msn.com",
          email_confirm: true,
        }
      );

    if (error) {
      console.error(
        "SET PASSWORD ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Sezai hesabının şifresi başarıyla güncellendi.",
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    });
  } catch (error) {
    console.error(
      "SET PASSWORD API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Şifre güncellenirken beklenmeyen bir hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
}