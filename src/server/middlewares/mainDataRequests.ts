import { commonS2SApi } from 'api';
import { LOADER_MSG } from 'components/Loader/loader.contant';
import { Booking } from 'models/PendingUpdate';
import { useDispatch } from 'react-redux';
import { setError } from 'store/Error/ErrorSlice';
import { startLoading, stopLoading } from 'store/Loader/LoaderSlice';
import { setMainData, setToken } from 'store/MainData/MainDataSlice';
import { AppDispatch } from 'store/store';
import { TRAVEL_STATUS_S2S_LIST_API } from 'utils/constants';
import { getKeyFromCookie } from 'utils/helpers';

const mainDataRequest = async (store: any, cookie: any) => { 
    const loaderDispatch = useDispatch<AppDispatch>();

    loaderDispatch(startLoading(LOADER_MSG.tripDetails.default));
    store.dispatch(commonS2SApi.endpoints.getApi.initiate({ cookie, url: TRAVEL_STATUS_S2S_LIST_API })).then((res: any) => {
        loaderDispatch(stopLoading());

        try{


            const response = JSON.parse(res.data);
            const tempTripData: Booking[] = [];
            response?.data?.forEach((tripDataItem: any) => {
                tripDataItem.bookings?.forEach((bookingsItem: Booking) => {
                    tempTripData?.push(bookingsItem);
                })
            })
            
            store.dispatch(setMainData(tempTripData))
            let csrfToken = getKeyFromCookie('XSRF-TOKEN', cookie);
            store.dispatch(setToken(csrfToken))
        }catch(e){
            store.dispatch(setError())
            return false
        }       
    })
    return Promise.all(store.dispatch(commonS2SApi.util.getRunningQueriesThunk()));
};
export { mainDataRequest };
