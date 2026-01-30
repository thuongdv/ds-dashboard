import settings from "settings";
import dwsQueues from "../../../dws-queues.json";

export const DWS_DASHBOARD_URL = `${settings.DWS_URL}/SwifTest/Dashboard`;
export const DWS_API_URL = `${settings.DWS_URL}/SwifTest`;
export const QUEUES = dwsQueues as {
  name: string;
  standardName: string;
  storeStatusFile: string;
}[];
