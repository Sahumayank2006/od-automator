import { collection, doc, setDoc, getDocs, serverTimestamp, query, updateDoc, orderBy } from "firebase/firestore";
import { db } from './firebase';
import type { ODFormValues } from "@/app/dashboard/page";
import type { TimetableData } from "@/app/timetable/page";

export type ODRequestStatus = "Pending" | "Accepted" | "Rejected";

export interface ODRequest extends ODFormValues {
    id: string;
    createdAt: any; 
    status: ODRequestStatus;
}


export async function saveOdRequest(data: ODFormValues) {
    try {
        const odRequestRef = doc(collection(db, "odRequests"));
        await setDoc(odRequestRef, {
            ...data,
            eventDate: data.eventDate.toISOString(),
            createdAt: serverTimestamp(),
            status: "Pending" 
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

export async function getAllOdRequests(): Promise<ODRequest[]> {
    try {
        const odRequestsCollection = collection(db, "odRequests");
        const q = query(odRequestsCollection, orderBy("createdAt", "desc"));
        const odRequestsSnapshot = await getDocs(q);
        const odRequests: ODRequest[] = odRequestsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                eventDate: new Date(data.eventDate),
                createdAt: data.createdAt?.toDate(),
            } as ODRequest;
        });
        return odRequests;
    } catch (error) {
        console.error("Error fetching OD requests:", error);
        return [];
    }
}

export async function updateOdRequestStatus(id: string, status: ODRequestStatus) {
    try {
        const odRequestRef = doc(db, "odRequests", id);
        await updateDoc(odRequestRef, { status });
        return { success: true };
    } catch (error) {
        console.error("Error updating OD request status: ", error);
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
