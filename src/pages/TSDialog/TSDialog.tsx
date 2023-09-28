import { Dialog, DialogTitle, IconButton, DialogContent, Button, MenuItem, TextField, Divider, Stack, FormControl, FormHelperText } from "@mui/material"
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useState } from "react";
import { SubmitErrorHandler, SubmitHandler, useForm } from "react-hook-form";
import { LOGIN_URL, PROD_BASE_URL, UPDATE_TRAVEL_STATUS } from "utils/ApiConstants";
import { commonApi } from "api/commonApi/apis";
import { RootState, useAppDispatch } from "store/store";
import { updateMainListData } from "store/MainData/MainDataSlice";
import { useSelector } from "react-redux";
import { hideTSDialog } from "store/TSDialogSlice/TSDialogSlice";
import { ALERT_DIALOG } from "constants/commonConstants";
import { showAlert } from "store/Alert/alertSlice";
import { YT_TRAVEL_DATA } from "utils/helpers";

interface TSDialogProps {
    onClose: () => void
}
const TSDialog = (props: TSDialogProps) => {
    const { register, formState: { errors }, handleSubmit } = useForm();
    const [selectedReason, setSelectedReason] = useState("");
    const [showTextField, setShowTextField] = useState(true);
    const show = useSelector((state: RootState) => state.tsDialog.show);
    const data = useSelector((state: RootState) => state.tsDialog.data);
    const dispatch = useAppDispatch();
    
    let modelData = {
        title: 'Reason for not travelling',
        statusList: [
            "Cancelled at Yatra",
            data.type === 'AIR' ? "Cancelled at Airline" : "Cancelled at Hotel",
            "No Show",
            "Dispute"
        ],
        reasonList: data?.reasonData?.reasonInputMaster,
        isShowReasonDropdown: data?.reasonData?.reasonInputType == 'both' || data?.reasonData?.reasonInputType == 'master' || data?.reasonData?.reasonInputType == 'dropdown'||false
    }
    useEffect(()=>{
        if(data?.reasonData?.reasonInputType)
        setShowTextField(data.reasonData.reasonInputType === 'text')
    },[data])
    const onClose = () => {
        //props.setDialogProps({ ...props, show: false })
        props.onClose();
        dispatch(hideTSDialog());
    }
    const onSubmit: SubmitHandler<any> = (fData) => {
        if (!modelData.isShowReasonDropdown) {
            alert("Reasons List not fetched from config.")
            return;
        }
        const obj = JSON.parse(JSON.stringify(data.tripData));

        obj.updateList[0].status = fData.status;
        obj.updateList[0].comment = showTextField ? fData.reasonText : fData.reason;
        delete obj.type;
        dispatch(commonApi.endpoints.postApi.initiate({ url: UPDATE_TRAVEL_STATUS, data: obj }))
            .then((res: any) => {
                try {
                    const resp = res.data;
                    if (resp.data && resp.data.status == 'success') {
                        //updating main data
                        props.onClose();
                        dispatch(updateMainListData(obj.updateList[0].id));
                        dispatch(hideTSDialog());
                    } else if (resp.data.httpCode == 401) {
                        //todo lgoin 
                        const redirectUrl = window.location.href;
                        const loginRequiredUrl = PROD_BASE_URL + LOGIN_URL + `channel=crp&returnUrl=` + redirectUrl;
                        window.location.href = loginRequiredUrl;
                    } else if (resp.data.httpCode == 500) {
                        //todo error handling
                        let alertData = {
                            title: ALERT_DIALOG.DIALOG_TITLE,
                            messages: [ALERT_DIALOG.TRY_AGAIN_MESSAGE],
                            actions: ['OK'],
                        };
                        dispatch(showAlert(alertData));
                    }
                } catch (e) {
                    console.log(e)
                    let alertData = {
                        title: ALERT_DIALOG.DIALOG_TITLE,
                        messages: [ALERT_DIALOG.TRY_AGAIN_MESSAGE],
                        actions: ['OK'],
                    };
                    dispatch(showAlert(alertData));
                }
            })

    };
    const onError: SubmitErrorHandler<any> = (errors, e) => console.log('ereroe', errors, e);

    // FUNCTION FOR REASONS DROPDOWN
    const handleChangeReason = (event: any) => {
        if (data?.reasonData && data?.reasonData.reasonInputType === YT_TRAVEL_DATA.noReasonBothType) {
            setShowTextField(event.target.value === YT_TRAVEL_DATA.noReasonText)
        }
        setSelectedReason(event.target.value as string);
    };

    const handlePaste = (e: any) => {
        e.preventDefault();
    };

    return (
        <Dialog open={show} fullWidth={true} maxWidth={'sm'}>
            <DialogTitle>{modelData.title}
                <IconButton onClick={() => onClose()}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                    }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent >
                <form onSubmit={handleSubmit(onSubmit, onError)}>
                    <Stack spacing={2}>
                        <FormControl size="small">
                            <TextField
                                select
                                className="w-50"
                                id="filled-size-normal"
                                label="Status"
                                {...register("status", { required: true })}

                                size="small"
                                defaultValue={""}
                            >
                                {modelData?.statusList && modelData?.statusList.map(
                                    (status: any) => (
                                        <MenuItem key={status} value={status}>{status}</MenuItem>
                                    )
                                )}
                            </TextField>

                            {errors.status?.type === 'required'||(!modelData?.isShowReasonDropdown) && <FormHelperText className="validation-error">{!modelData.isShowReasonDropdown?'Config issue not getting reasons':'Please select status'}</FormHelperText>}
                        </FormControl>

                        {/* REASONS DROPDOWN */}
                        {
                            modelData?.isShowReasonDropdown &&
                            <FormControl >
                                <TextField
                                    size="small"
                                    select
                                    className="w-50"
                                    id="nt-reason"
                                    label="Reason"
                                    value={selectedReason}
                                    defaultValue={""}
                                    {...register("reason", { required: true })}
                                    onChange={handleChangeReason}
                                >
                                    <MenuItem key="select reason" value="" disabled>Select reason</MenuItem>
                                    {modelData.reasonList.map((reason: string) => <MenuItem key={reason} value={reason}>{reason}</MenuItem>)}
                                </TextField>

                                {errors.reason?.type == 'required' && <FormHelperText className="validation-error">Please select reason</FormHelperText>}
                            </FormControl>
                        }

                        {showTextField &&
                            <FormControl>
                                <TextField
                                    {...register('reasonText', {
                                        required: true,
                                        minLength: 10,
                                        pattern: /^(?!.*(?:[<>[\]@!#$%^&*()]|href))[a-zA-Z0-9,.-]+$/
                                    })}
                                    sx={{ marginTop: '12px' }}
                                    id="outlined-textarea"
                                    className="w-100"
                                    multiline
                                    rows={3}
                                    defaultValue=""
                                    onPaste={handlePaste}
                                />
                                {errors.reasonText && errors.reasonText.type === 'required' && (
                                    <FormHelperText className="validation-error">This field is required</FormHelperText>
                                )}
                                {errors.reasonText && errors.reasonText.type === 'minLength' && (
                                    <FormHelperText className="validation-error">Enter minimum 10 characters</FormHelperText>
                                )}
                                {errors.reasonText && errors.reasonText.type === 'pattern' && (
                                    <FormHelperText className="validation-error">Special characters are not allowed</FormHelperText>
                                )}
                            </FormControl>
                        }

                        <Button variant="contained" color="error" size="small" type="submit" className="w-25"

                            sx={{ boxShadow: 'none', textTransform: 'none', fontSize: '12px!important', fontWeight: '500', borderRadius: '4px!important' }} >Submit</Button>
                    </Stack>

                </form>

            </DialogContent>
        </Dialog>
    )
}

export default TSDialog