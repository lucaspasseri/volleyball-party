import "server-only";
import { cache } from "react";
import { z } from "zod";
import { auth, getGuest } from "@/lib/auth/server";
import { databaseConfigured, queryValue } from "@/lib/db";
import {
  profileSchema,
  publicAttendanceSchema,
  safeAvatarUrl,
  savedRsvpSchema,
  type RsvpView,
} from "@/lib/rsvp";

const guestResponse = z.object({
  rsvp: savedRsvpSchema,
  profile: profileSchema,
});

export const getRsvpView = cache(async (): Promise<RsvpView> => {
  const view: RsvpView = {
    configured: Boolean(auth) && databaseConfigured(),
    user: null,
    rsvp: null,
    profile: null,
    attendance: null,
    inviteRequired: false,
    organizer: false,
  };
  if (!view.configured) return view;
  try {
    const [user, attendance, inviteRequired] = await Promise.all([
      getGuest(),
      queryValue("select pesca.public_attendance() as value"),
      queryValue("select pesca.invitation_required() as value"),
    ]);
    view.attendance = publicAttendanceSchema.parse(attendance);
    view.inviteRequired = inviteRequired === true;
    if (user) {
      view.user = {
        name: user.name?.slice(0, 100) ?? "",
        avatarUrl: safeAvatarUrl(user.avatar),
      };
      const [response, organizer] = await Promise.all([
        queryValue("select pesca.guest_response($1) as value", [user.id]),
        queryValue("select pesca.is_organizer($1) as value", [user.id]),
      ]);
      const guest = guestResponse.nullable().parse(response);
      view.rsvp = guest?.rsvp ?? null;
      view.profile = guest?.profile ?? null;
      view.organizer = organizer === true;
    }
  } catch {
    view.error =
      "A lista fez uma pausa. Recarregue a página para tentar de novo; seus dados continuam guardados.";
  }
  return view;
});
