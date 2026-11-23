import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import {
  deriveAttendanceState,
  profileSchema,
  publicAttendanceSchema,
  safeAvatarUrl,
  savedRsvpSchema,
  type RsvpView,
} from "@/lib/rsvp";

export const getRsvpView = cache(async (): Promise<RsvpView> => {
  const view: RsvpView = {
    configured: Boolean(supabaseConfig()),
    user: null,
    rsvp: null,
    profile: null,
    attendance: null,
    attendanceState: deriveAttendanceState(false, null),
    inviteRequired: false,
    organizer: false,
  };
  if (!view.configured) return view;
  try {
    const db = await createClient();
    const [auth, attendance, settings] = await Promise.all([
      db.auth.getUser(),
      db.rpc("public_attendance"),
      db.rpc("invitation_required"),
    ]);
    if (attendance.error || settings.error) throw new Error("Read failed");
    view.attendance = publicAttendanceSchema.parse(attendance.data);
    view.inviteRequired = settings.data === true;
    if (auth.error && auth.error.name !== "AuthSessionMissingError")
      throw new Error("Auth unavailable");
    const user = auth.data.user;
    if (user) {
      view.user = {
        name:
          typeof user.user_metadata.full_name === "string"
            ? user.user_metadata.full_name.slice(0, 100)
            : typeof user.user_metadata.name === "string"
              ? user.user_metadata.name.slice(0, 100)
              : "",
        avatarUrl: safeAvatarUrl(user.user_metadata.avatar_url),
      };
      const [rsvp, profile, organizer] = await Promise.all([
        db.from("rsvps").select("*").eq("guest_id", user.id).maybeSingle(),
        db
          .from("guest_profiles")
          .select("full_name,display_name,avatar_url")
          .eq("id", user.id)
          .maybeSingle(),
        db.rpc("is_organizer"),
      ]);
      if (rsvp.error || profile.error || organizer.error)
        throw new Error("Read failed");
      view.rsvp = rsvp.data ? savedRsvpSchema.parse(rsvp.data) : null;
      view.profile = profile.data ? profileSchema.parse(profile.data) : null;
      view.organizer = organizer.data === true;
      view.attendanceState = deriveAttendanceState(true, view.rsvp);
    }
  } catch {
    view.error =
      "A lista fez uma pausa. Recarregue a página para tentar de novo; seus dados continuam guardados.";
  }
  return view;
});

export async function getAttendanceState() {
  return (await getRsvpView()).attendanceState;
}

export async function organizerClient() {
  const db = await createClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) return null;
  const role = await db.rpc("is_organizer");
  return !role.error && role.data === true ? db : null;
}
