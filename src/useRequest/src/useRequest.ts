import {useCallback, useEffect, useState} from "react";
import useCreation from "../../useCreation";
import {UseRequestOptions} from "./types";


const POLLING_INTERVAL_MINIMUM=999;
function canCallPollingApi(pollingEnabled=false,pollingInterval=0){
    return pollingEnabled && pollingInterval>POLLING_INTERVAL_MINIMUM;
}

export default function useRequest<TOptions extends UseRequestOptions>(apiCall:Function, options:TOptions) {
    const [apiData, setApiData] = useState({} as any);
    const [apiLoading, setApiLoading] = useState(false);
    const [isTabActive, setIsTabActive] = useState(true);

    const {runOnLoad = true, pollingEnabled = false, pollingInterval = 0} = options;

    const fetchOptions={
        apiCall,
        ...options
    }

    const fetchInstance = useCreation(() => {
        return fetchOptions
    }, []);

    const runApi=useCallback(async ()=>{
        setApiLoading(true);
        const response=await fetchInstance.apiCall();
        setApiLoading(false)
        setApiData(response);
        return response;
    },[fetchInstance])

    useEffect(()=>{
        window.addEventListener('blur', setTabAsInactive);
        window.addEventListener('focus', setTabAsActive);

        return ()=>{
            window.removeEventListener('blur', setTabAsInactive);
            window.removeEventListener('focus', setTabAsActive);
        }

    },[])

    useEffect(() => {
        if (runOnLoad) {
            runApi();
        }
    }, [runApi, runOnLoad]);

    function setTabAsActive(){
        setIsTabActive(true);
    }
    function setTabAsInactive(){
        setIsTabActive(false);
    }

    useEffect(() => {
        let intervalEventId: NodeJS.Timer;

        if (canCallPollingApi(pollingEnabled,pollingInterval)) {
            intervalEventId = setInterval(() => {
                if(isTabActive){
                    runApi();
                }
            }, pollingInterval);
        }
        return (() => {
            if(Number(intervalEventId)>0)
                clearInterval(Number(intervalEventId));
        })

    }, [runApi,pollingEnabled, pollingInterval,isTabActive])

    return {
        run:runApi,
        data: apiData,
        loading: apiLoading
    }
}
