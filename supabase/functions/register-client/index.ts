
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return respond({ error: "Method not allowed." }, 405);
  }

  let createdUserId: string | null = null;

  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return respond({ error: "Authentication required." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    const publishableKeys = JSON.parse(
      Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}"
    );

    const secretKeys = JSON.parse(
      Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"
    );

    const anonKey = publishableKeys.default;
    const serviceRoleKey = secretKeys.default;

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return respond(
        { error: "Server configuration is incomplete." },
        500
      );
    }

    // Verify the signed-in user.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: authorization },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError || !caller) {
      return respond(
        { error: "Authentication required." },
        401
      );
    }

    // Service-role client is used only inside this Edge Function.
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Check whether the signed-in user is an authorized administrator.
    const {
      data: adminRecord,
      error: adminCheckError,
    } = await adminClient
      .from("admin_users")
      .select("user_id")
      .eq("user_id", caller.id)
      .maybeSingle();

    if (adminCheckError) {
      console.error(
        "Admin verification failed:",
        adminCheckError.message
      );

      return respond(
        { error: "Unable to verify administrator access." },
        500
      );
    }

    if (!adminRecord) {
      return respond(
        { error: "Administrator access required." },
        403
      );
    }

    const body = await req.json();

    const adminPassword = body?.adminPassword;
    const fullName = body?.fullName;
    const username = body?.username;
    const temporaryPassword = body?.temporaryPassword;
    const contactNumber = body?.contactNumber ?? null;
    const province = body?.province ?? null;
    const municipality = body?.municipality ?? null;
    const barangay = body?.barangay ?? null;

    // Validate administrator password.
    if (
      typeof adminPassword !== "string" ||
      adminPassword.length === 0 ||
      adminPassword.length > 256
    ) {
      return respond(
        { error: "Enter your administrator password." },
        400
      );
    }

    // Validate client information.
    if (
      typeof fullName !== "string" ||
      !fullName.trim() ||
      fullName.trim().length > 150
    ) {
      return respond(
        { error: "Enter a valid client name." },
        400
      );
    }

    if (
      typeof username !== "string" ||
      !/^[a-z0-9_]{3,30}$/i.test(username.trim())
    ) {
      return respond(
        {
          error:
            "Username must contain 3–30 letters, numbers, or underscores.",
        },
        400
      );
    }

    if (
      typeof temporaryPassword !== "string" ||
      temporaryPassword.length < 8 ||
      temporaryPassword.length > 72
    ) {
      return respond(
        { error: "Temporary password must be 8–72 characters." },
        400
      );
    }

    const optionalFields = [
      { value: contactNumber, name: "Contact number", max: 30 },
      { value: province, name: "Province", max: 100 },
      { value: municipality, name: "Municipality", max: 100 },
      { value: barangay, name: "Barangay", max: 100 },
    ];

    for (const field of optionalFields) {
      if (
        field.value !== null &&
        (typeof field.value !== "string" ||
          field.value.length > field.max)
      ) {
        return respond(
          { error: `Invalid ${field.name.toLowerCase()}.` },
          400
        );
      }
    }

    if (!caller.email) {
      return respond(
        { error: "Administrator email is unavailable." },
        400
      );
    }

    // Confirm the administrator's password.
    const verificationClient = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: verification,
      error: verificationError,
    } = await verificationClient.auth.signInWithPassword({
      email: caller.email,
      password: adminPassword,
    });

    if (
      verificationError ||
      verification.user?.id !== caller.id
    ) {
      return respond(
        { error: "Incorrect administrator password." },
        401
      );
    }

    const normalizedUsername = username.trim().toLowerCase();
    const clientEmail = `${normalizedUsername}@scarecrow.app`;

    // Create the client's Supabase Auth account.
    const {
      data: authData,
      error: authError,
    } = await adminClient.auth.admin.createUser({
      email: clientEmail,
      password: temporaryPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error(
        "Client Auth creation failed:",
        authError?.message
      );

      return respond(
        {
          error:
            "Unable to create the client account. The username may already be registered.",
        },
        400
      );
    }

    createdUserId = authData.user.id;

    // Create the corresponding client profile.
    const { error: profileError } = await adminClient
      .from("profiles")
      .insert({
        id: createdUserId,
        full_name: fullName.trim(),
        contact_number: contactNumber?.trim() || null,
        province: province?.trim() || null,
        municipality: municipality?.trim() || null,
        barangay: barangay?.trim() || null,
      });

    if (profileError) {
      console.error(
        "Client profile creation failed:",
        profileError.message
      );

      // Roll back the Auth account to avoid incomplete registration.
      const { error: rollbackError } =
        await adminClient.auth.admin.deleteUser(createdUserId);

      if (rollbackError) {
        console.error(
          "Client account rollback failed:",
          rollbackError.message
        );

        return respond(
          {
            error:
              "Profile creation failed and account cleanup needs administrator attention.",
          },
          500
        );
      }

      createdUserId = null;

      return respond(
        { error: "Unable to save the client profile." },
        400
      );
    }

    return respond({
      success: true,
      message: "Client account registered successfully.",
      client: {
        id: createdUserId,
        fullName: fullName.trim(),
        username: normalizedUsername,
        email: clientEmail,
      },
    });
  } catch (error) {
    console.error("Register-client function error:", error);

    return respond(
      { error: "Unable to process client registration." },
      500
    );
  }
});