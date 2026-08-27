import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

if (!anonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY eksik."
  );
}

/*
 * SERVER-SIDE ADMIN CLIENT
 *
 * Service Role Key yalnızca burada kullanılır.
 * Bu anahtar frontend'e gönderilmez.
 */
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

/*
 * Şifre doğrulamak için kullanılacak normal
 * Supabase Auth client.
 */
const supabaseAuth = createClient(
  supabaseUrl,
  anonKey,
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
    /*
     * --------------------------------------------------
     * 1. REQUEST BODY
     * --------------------------------------------------
     */

    let body: {
      username?: unknown;
      password?: unknown;
    };

    try {
      body = await request.json();
    } catch {
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

    /*
     * --------------------------------------------------
     * 2. STAFF_USERS KONTROLÜ
     * --------------------------------------------------
     */

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
        "================================="
      );

      console.error(
        "STAFF LOOKUP ERROR"
      );

      console.error(
        "Code:",
        staffError.code
      );

      console.error(
        "Message:",
        staffError.message
      );

      console.error(
        "Details:",
        staffError.details
      );

      console.error(
        "Hint:",
        staffError.hint
      );

      console.error(
        "================================="
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Personel veritabanı kontrol edilemedi.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !staffRows ||
      staffRows.length === 0
    ) {
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

    /*
     * Aynı kullanıcı adı birden fazla kayıt
     * içeriyorsa güvenlik nedeniyle girişe
     * izin vermiyoruz.
     */
    if (staffRows.length > 1) {
      console.error(
        "DUPLICATE STAFF USERNAME:",
        username
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Bu kullanıcı adı birden fazla personelde kayıtlı. Yönetici tarafından düzeltilmesi gerekiyor.",
        },
        {
          status: 409,
        }
      );
    }

    const staff = staffRows[0];

    /*
     * --------------------------------------------------
     * 3. AUTH USER KONTROLÜ
     * --------------------------------------------------
     */

    if (!staff.auth_user_id) {
      console.error(
        "STAFF AUTH USER ID MISSING:",
        staff.id
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
        "AUTH USER ERROR"
      );

      console.error(
        "Code:",
        authUserError?.status
      );

      console.error(
        "Message:",
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
        "AUTH USER EMAIL MISSING:",
        staff.auth_user_id
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

    /*
     * --------------------------------------------------
     * 4. ŞİFRE DOĞRULAMA
     * --------------------------------------------------
     *
     * Kullanıcı kullanıcı adıyla giriş yapıyor.
     * Supabase Auth ise e-posta + şifre kullanıyor.
     *
     * staff_users.username
     *        ↓
     * staff_users.auth_user_id
     *        ↓
     * Supabase Auth email
     *        ↓
     * email + password
     */

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
        "AUTH LOGIN FAILED:",
        {
          username,
          message:
            loginError?.message,
          status:
            loginError?.status,
        }
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

    /*
     * --------------------------------------------------
     * 5. BAŞARILI GİRİŞ
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
      "================================="
    );

    console.error(
      "ADMIN LOGIN API ERROR"
    );

    console.error(
      error
    );

    console.error(
      "================================="
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Giriş sırasında beklenmeyen bir hata oluştu.",
      },
      {
        status: 500,
      }
    );
  }
}