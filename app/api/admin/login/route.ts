import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} eksik.`);
  }

  return value;
}

export async function POST(
  request: NextRequest
) {
  try {
    console.log(
      "[ADMIN LOGIN] API başladı."
    );

    /*
     * --------------------------------------------------
     * 1. ENVIRONMENT VARIABLES
     * --------------------------------------------------
     */

    const supabaseUrl = getEnv(
      "NEXT_PUBLIC_SUPABASE_URL"
    );

    const serviceRoleKey = getEnv(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    const anonKey = getEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );

    console.log(
      "[ADMIN LOGIN] Environment variables bulundu."
    );

    /*
     * --------------------------------------------------
     * 2. SERVER SUPABASE CLIENT
     * --------------------------------------------------
     */

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

    /*
     * --------------------------------------------------
     * 3. REQUEST BODY
     * --------------------------------------------------
     */

    let body: {
      username?: unknown;
      password?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      console.error(
        "[ADMIN LOGIN] JSON okunamadı."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Geçersiz istek gönderildi.",
        },
        {
          status: 400,
        }
      );
    }

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
          success: false,
          error:
            "Kullanıcı adı ve şifre gereklidir.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "[ADMIN LOGIN] Kullanıcı adı:",
      username
    );

    /*
     * --------------------------------------------------
     * 4. STAFF USERS
     * --------------------------------------------------
     */

    console.log(
      "[ADMIN LOGIN] staff_users sorgulanıyor..."
    );

    const {
      data: staffRows,
      error: staffError,
    } = await supabaseAdmin
      .from("staff_users")
      .select(
        "id, auth_user_id, name, username, role, created_at"
      )
      .eq(
        "username",
        username
      )
      .limit(2);

    if (staffError) {
      console.error(
        "[ADMIN LOGIN] STAFF DATABASE ERROR"
      );

      console.error(
        "code:",
        staffError.code
      );

      console.error(
        "message:",
        staffError.message
      );

      console.error(
        "details:",
        staffError.details
      );

      console.error(
        "hint:",
        staffError.hint
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Personel veritabanı kontrol edilemedi.",
          debug:
            process.env.NODE_ENV ===
            "development"
              ? staffError.message
              : undefined,
        },
        {
          status: 500,
        }
      );
    }

    console.log(
      "[ADMIN LOGIN] staff_users sorgusu başarılı."
    );

    if (
      !staffRows ||
      staffRows.length === 0
    ) {
      console.log(
        "[ADMIN LOGIN] Kullanıcı bulunamadı:",
        username
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Kullanıcı adı veya şifre hatalı.",
        },
        {
          status: 401,
        }
      );
    }

    if (staffRows.length > 1) {
      console.error(
        "[ADMIN LOGIN] Aynı kullanıcı adına sahip birden fazla personel var:",
        username
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Bu kullanıcı adı birden fazla personelde kayıtlı.",
        },
        {
          status: 409,
        }
      );
    }

    const staff = staffRows[0];

    console.log(
      "[ADMIN LOGIN] Personel bulundu:",
      {
        id: staff.id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
      }
    );

    /*
     * --------------------------------------------------
     * 5. AUTH USER
     * --------------------------------------------------
     */

    if (!staff.auth_user_id) {
      console.error(
        "[ADMIN LOGIN] auth_user_id boş."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Personel hesabının Auth bağlantısı bulunamadı.",
        },
        {
          status: 401,
        }
      );
    }

    console.log(
      "[ADMIN LOGIN] Supabase Auth kullanıcısı kontrol ediliyor..."
    );

    const {
      data: authUserData,
      error: authUserError,
    } =
      await supabaseAdmin.auth.admin.getUserById(
        staff.auth_user_id
      );

    if (
      authUserError ||
      !authUserData.user
    ) {
      console.error(
        "[ADMIN LOGIN] AUTH USER ERROR"
      );

      console.error(
        "status:",
        authUserError?.status
      );

      console.error(
        "message:",
        authUserError?.message
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Personel hesabının Supabase Auth bağlantısı bulunamadı.",
        },
        {
          status: 401,
        }
      );
    }

    const email =
      authUserData.user.email;

    if (!email) {
      console.error(
        "[ADMIN LOGIN] Auth kullanıcısında email yok."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Personel hesabında giriş e-postası bulunamadı.",
        },
        {
          status: 401,
        }
      );
    }

    console.log(
      "[ADMIN LOGIN] Auth kullanıcısı bulundu."
    );

    /*
     * --------------------------------------------------
     * 6. ŞİFRE KONTROLÜ
     * --------------------------------------------------
     */

    const supabaseAuth =
      createClient(
        supabaseUrl,
        anonKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

    console.log(
      "[ADMIN LOGIN] Şifre doğrulanıyor..."
    );

    const {
      data: loginData,
      error: loginError,
    } =
      await supabaseAuth.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

    if (
      loginError ||
      !loginData.session
    ) {
      console.error(
        "[ADMIN LOGIN] AUTH LOGIN FAILED"
      );

      console.error(
        "status:",
        loginError?.status
      );

      console.error(
        "message:",
        loginError?.message
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Kullanıcı adı veya şifre hatalı.",
        },
        {
          status: 401,
        }
      );
    }

    console.log(
      "[ADMIN LOGIN] Giriş başarılı."
    );

    /*
     * --------------------------------------------------
     * 7. BAŞARILI GİRİŞ
     * --------------------------------------------------
     */

    return NextResponse.json(
      {
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

          name:
            staff.name,

          username:
            staff.username,

          role:
            staff.role,

          created_at:
            staff.created_at,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "[ADMIN LOGIN] FATAL ERROR"
    );

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Giriş sırasında sunucu hatası oluştu.",
      },
      {
        status: 500,
      }
    );
  }
}