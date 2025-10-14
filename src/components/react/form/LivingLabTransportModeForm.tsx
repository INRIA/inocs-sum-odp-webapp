import { useState } from "react";
import { Field, Select } from "../../react-catalyst-ui-kit";
import {
  EnumTransportModeStatus,
  type ITransportModeLivingLabImplementation,
} from "../../../types";
import { useEffect, useRef } from "react";
import ApiClient from "../../../lib/api-client/ApiClient";
const api = new ApiClient();

interface Props {
  value?: ITransportModeLivingLabImplementation;
  transportModeId: string;
  livingLabId: string;
  onCancel?: () => void;
  onChange?: (data: ITransportModeLivingLabImplementation) => void;
  onDelete?: (id: string) => void;
}

export function LivingLabTransportModeForm({
  value,
  transportModeId,
  livingLabId,
  onChange,
  onCancel,
}: Props) {
  const [editing, setEditing] = useState(false);

  const [status, setStatus] = useState<EnumTransportModeStatus>(
    value?.status ?? EnumTransportModeStatus.NOT_AVAILABLE
  );
  const prevStatusRef = useRef<EnumTransportModeStatus>(status);
  const [id, setId] = useState<string | undefined>(value?.id);

  const badgeConfig = {
    [EnumTransportModeStatus.NOT_AVAILABLE]: {
      color: "light",
      shortLabel: "Not Available",
    },
    [EnumTransportModeStatus.IN_SERVICE]: {
      color: "info",
      shortLabel: "In Service",
    },
    [EnumTransportModeStatus.NEW]: {
      color: "success",
      shortLabel: "New",
    },
    [EnumTransportModeStatus.OPTIMIZATION_SCHEDULED]: {
      color: "warning",
      shortLabel: "To optimize",
    },
  };

  const handleSave = async (status: EnumTransportModeStatus) => {
    // let _id = id;
    // if (_id) {
    //   api.upsertLivingLabTransportModes
    // }
    let _id = id;
    if (!id && status === EnumTransportModeStatus.NOT_AVAILABLE) {
      // nothing to do
      return;
    }

    if (id && status === EnumTransportModeStatus.NOT_AVAILABLE) {
      await api.deleteLivingLabTransportModes({
        living_lab_id: livingLabId,
        transport_mode_id: transportModeId,
      });
      onChange?.({
        id,
        status,
        transport_mode_id: transportModeId,
        living_lab_id: livingLabId,
      });
      setEditing(false);
    } else {
      const newData = await api.upsertLivingLabTransportModes({
        living_lab_id: livingLabId,
        transport_mode_id: transportModeId,
        status,
      });
      _id = newData?.id;
      setId(_id);
    }

    onChange?.({
      id: _id,
      status,
      transport_mode_id: transportModeId,
      living_lab_id: livingLabId,
    });
    setEditing(false);
  };

  useEffect(() => {
    if (prevStatusRef.current !== status) {
      handleSave(status);
    }
    prevStatusRef.current = status;
  }, [status]);

  // const handleClose = () => {
  //   // revert local changes and notify parent
  //   setStatus(value?.status ?? EnumTransportModeStatus.NOT_AVAILABLE);
  //   onCancel?.();
  //   setEditing(false);
  // };

  // if (!editing) {
  //   return (
  //     <div className="flex justify-end items-end gap-1 w-40">
  //       <Badge
  //         size="sm"
  //         color={badgeConfig[status]?.color}
  //         className=""
  //         aria-label={`${status} status in living lab`}
  //       >
  //         {badgeConfig[status]?.shortLabel}
  //       </Badge>
  //       <button
  //         type="button"
  //         aria-label="Edit"
  //         onClick={() => setEditing(true)}
  //         className="inline-flex items-center"
  //       >
  //         <PencilSquareIcon className="h-5 w-5 text-primary" />
  //       </button>
  //     </div>
  //   );
  // }

  return (
    <form
      // onSubmit={handleSave}
      className="flex flex-col items-start space-x-3 gap-2 w-40"
    >
      <Field className="w-36">
        <Select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as EnumTransportModeStatus)}
        >
          {Object.values(EnumTransportModeStatus).map((option) => (
            <option key={option} value={option}>
              {badgeConfig[option]?.shortLabel}
            </option>
          ))}
        </Select>
      </Field>
      {/* <div className="flex flex-row justify-end items-end w-full space-x-2">
        <button
          type="submit"
          aria-label="Save"
          onClick={handleSave}
          className="inline-flex items-center"
        >
          <CheckCircleIcon className="h-5 w-5 text-success" />
        </button>
        <button
          type="button"
          aria-label="Cancel"
          onClick={handleClose}
          className="inline-flex items-center"
        >
          <XMarkIcon className="h-5 w-5 text-dark" />
        </button>
      </div> */}
    </form>
  );
}
