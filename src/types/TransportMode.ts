import type { IIKpiResultBeforeAfter } from "./KPIs";
import type { ILivingLabPopulated } from "./LivingLab";

export interface ITransportMode {
  id: string;
  name: string;
  description?: string;
  type: EnumTransportModeType;
  color?: string; // hex color code, e.g. #ff0000
}

export interface ITransportModeSplit extends ITransportMode {
  kpi_results?: IIKpiResultBeforeAfter[];
}

export interface ITransportModeLivingLabImplementation {
  id: string;
  transport_mode_id: string;
  transport_mode?: ITransportMode;
  living_lab_id: string;
  living_lab?: ILivingLabPopulated;
  status: EnumTransportModeStatus;
}

export interface ITransportModeLivingLabEdit
  extends Pick<
    ITransportModeLivingLabImplementation,
    "status" | "transport_mode_id" | "living_lab_id"
  > {}
export interface ITransportModeLivingLabDelete
  extends Pick<
    ITransportModeLivingLabImplementation,
    "transport_mode_id" | "living_lab_id"
  > {}

export enum EnumTransportModeType {
  NSM = "NSM",
  PUBLIC_TRANSPORT = "PUBLIC_TRANSPORT",
  PRIVATE = "PRIVATE",
}

export const TransportModeTypeLabels: Record<EnumTransportModeType, string> = {
  [EnumTransportModeType.NSM]: "New Mobility Service",
  [EnumTransportModeType.PUBLIC_TRANSPORT]: "Public Transport",
  [EnumTransportModeType.PRIVATE]: "Private Transport",
};

export enum EnumTransportModeStatus {
  IN_SERVICE = "IN_SERVICE",
  NEW = "NEW",
  OPTIMIZATION_SCHEDULED = "OPTIMIZATION_SCHEDULED",
  NOT_AVAILABLE = "NOT_AVAILABLE",
}

export const TransportModeStatusLabels: Record<
  EnumTransportModeStatus,
  string
> = {
  [EnumTransportModeStatus.IN_SERVICE]: "In Service",
  [EnumTransportModeStatus.NEW]: "New",
  [EnumTransportModeStatus.OPTIMIZATION_SCHEDULED]: "Optimization Scheduled",
  [EnumTransportModeStatus.NOT_AVAILABLE]: "Not Available",
};
