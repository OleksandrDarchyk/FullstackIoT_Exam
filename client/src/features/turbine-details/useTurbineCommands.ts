import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "@api/api";
import { showApiError } from "@api/customFetch";
import { isLoggedIn } from "@auth/jwt";
import type { TurbineCommand } from "./types";

export function useTurbineCommands(turbineId: string) {
    const [sending, setSending] = useState(false);
    const loggedIn = isLoggedIn();

    async function sendCommand(command: TurbineCommand) {
        if (!loggedIn) {
            toast.error("Please sign in to send commands");
            return;
        }
        setSending(true);
        try {
            await api.commands.sendCommand(turbineId, command);
            toast.success("Command sent");
        } catch (e) {
            showApiError(e);
        } finally {
            setSending(false);
        }
    }

    return { sendCommand, loggedIn, sending };
}
