import { collection, doc, setDoc, getDocs, serverTimestamp, query } from "firebase/firestore";
import { db } from './firebase';
import type { ODFormValues } from "@/app/dashboard/page";
import type { TimetableData } from "@/app/timetable/page";

export async function saveOdRequest(data: ODFormValues) {
    try {
        const odRequestRef = doc(collection(db, "odRequests"));
        await setDoc(odRequestRef, {
            ...data,
            eventDate: data.eventDate.toISOString(),
            createdAt: serverTimestamp()
        });
        return { success: true, id: odRequestRef.id };
    } catch (error) {
        console.error("Error saving OD request: ", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "An unknown error occurred." };
    }
}

export async function saveTimetable(data: TimetableData) {
    try {
        const key = `${data.course}-${data.program}-${data.semester}-${data.section}`;
        const timetableRef = doc(db, "timetables", key);
        await setDoc(timetableRef, data);
        return { success: true, id: timetableRef.id };
    } catch (error) {
        console.error("Error saving timetable: ", error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "An unknown error occurred." };
    }
}

export async function loadAllTimetables(): Promise<Record<string, TimetableData>> {
    try {
        const timetablesCollection = collection(db, "timetables");
        const timetablesSnapshot = await getDocs(query(timetablesCollection));
        const timetables: Record<string, TimetableData> = {};
        timetablesSnapshot.forEach((doc) => {
            timetables[doc.id] = doc.data() as TimetableData;
        });
        return timetables;
    } catch (error) {
        console.error("Error loading timetables: ", error);
        return {};
    }
}
