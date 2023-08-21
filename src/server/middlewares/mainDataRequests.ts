import { commonS2SApi } from 'api';
// import { setError } from 'store/Error/ErrorSlice';
import { setMainData,setToken } from 'store/MainData/mainDataSlice';
import { TRAVEL_STATUS_S2S_LIST_API } from 'utils/constants';
import { getKeyFromCookie } from 'utils/helpers';
import  {tripMockData} from '../../mockData';
//const { appLogger } = require('../../utils/logger');


// interface MainData {
//     mainData: object,
//     csrfToke: string
// }

// const mainDataWindow = typeof window !== 'undefined' && window as any;

const mainDataRequest = async (store: any,cookie:any) => {
    console.log("mainData========================>???>>>>>>>>>")
    store.dispatch(commonS2SApi.endpoints.getApi.initiate({cookie,url: TRAVEL_STATUS_S2S_LIST_API })).then((res: any) => {
        //appLogger.info(`main data response ----------->>> ${res}`);
        console.log("responseee",res.data)
        const tempTripData : any[] = [];
        tripMockData?.data?.forEach((tripDataItem: any) => {
                  tripDataItem.bookings?.forEach((bookingsItem: any) => {
                    tempTripData?.push(bookingsItem);
                  })
                })
        let mainData =  tempTripData     
        console.log("main=============",mainData)
        // if(typeof res.data === 'string'){
        //     try{
        //         mainData = JSON.parse(mainData); 
        //     }
        //     catch(e){
        //         store.dispatch(setError())
        //         return false
        //     }
        // }
        console.log("reducer mainData",mainData);
        store.dispatch(setMainData(mainData))
        let csrfToken = getKeyFromCookie('XSRF-TOKEN',cookie);
        store.dispatch(setToken(csrfToken))
    })
    return Promise.all(store.dispatch(commonS2SApi.util.getRunningQueriesThunk()));
};
export { mainDataRequest };
