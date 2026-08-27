import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Supabase server environment variables eksik."
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

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const username = String(
      body?.username ?? ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      body?.password ?? ""
    );

    if (!username || !password) {
      return NextResponse.json(
        {
          error:
            "Kullanıcı adı ve şifre gereklidir.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: staff,
      error: staffError,
    } =
      await supabaseAdmin
        .from("staff_users")
        .select(
          "id, auth_user_id, name, username, role, created_at"
        )
        .ilike(
          "username",
          username
        )
        .maybeSingle();

    if (staffError) {
      console.error(
        "STAFF LOOKUP ERROR:",
        staffError
      );

      return NextResponse.json(
        {
          error:
            "Kullanıcı kontrol edilemedi.",
        },
        {
          status: 500,
        }
      );
    }

    if (!staff) {
      return NextResponse.json(
        {
          error:
            "Kullanıcı adı veya şifre hatalı.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Supabase Auth kullanıcısını bul.
     */
    const {
      data: authUser,
      error: authUserError,
    } =
      await supabaseAdmin.auth.admin.getUserById(
        staff.auth_user_id
      );

    if (
      authUserError ||
      !authUser.user
    ) {
      console.error(
        "AUTH USER ERROR:",
        authUserError
      );

      return NextResponse.json(
        {
          error:
            "Personel hesabının Auth bağlantısı bulunamadı.",
        },
        {
          status: 401,
        }
      );
    }

    const email =
      authUser.user.email;

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Personel hesabında giriş bilgisi bulunamadı.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Şifreyi doğrulamak için geçici bir
     * Supabase Auth istemcisi oluşturuyoruz.
     */
    const authClient =
      createClient(
        supabaseUrl!,
        process.env
          .NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

    const {
      data: loginData,
      error: loginError,
    } =
      await authClient.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

    if (
      loginError ||
      !loginData.session
    ) {
      return NextResponse.json(
        {
          error:
            "Kullanıcı adı veya şifre hatalı.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Admin panelinin kullanacağı Supabase
     * session bilgisini döndürüyoruz.
     */
    return NextResponse.json({
      success: true,

      session: {
        access_token:
          loginData.session
            .access_token,

        refresh_token:
          loginData.session
            .refresh_token,
      },

      staff: {
        id: staff.id,
        auth_user_id:
          staff.auth_user_id,
        name: staff.name,
        username:
          staff.username,
        role: staff.role,
        created_at:
          staff.created_at,
      },
    });
  } catch (error) {
    console.error(
      "ADMIN LOGIN API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Giriş sırasında beklenmeyen bir hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
}