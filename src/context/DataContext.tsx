import { createContext, useEffect, useState } from "react";
import jwtDecode from "jwt-decode"
import { NetworkDataType, NetworkErrorType, NetworkLoadingType, ProviderType, PinType } from "../@types";
import APIROUTES from "../apiRoutes";
import Fetch from "../utils/fetch";


const DataContext = createContext({})

export default DataContext

const PAYRILL_STORAGE_NAME = "payrill"
const PAYRILL_AUTHTOKEN_NAME = "payrill-authtoken"


export function DataContextProvider({ children }: any) {

    const [user, setUser] = useState<any>({})
    const [pin, setPin] = useState<PinType>({
        labelPin: "----",
        copyPin: "",
        originalPin: ""
    })

    const [walletInfo, setWalletInfo] = useState<any>({})
    
    const [Data, setData] = useState<any>({
        users: [],
        wallet: [],
        transactions: [],
        cards: [],
        products: []
    })
    const [Loader, setLoader] = useState<any>({
        wallet:false,
        users: false,
        transactions: false,
        transfer: false,
        withdraw: false,
        getCards: false,
        createCards: false,
        changeCardStatus: false,
        topUp: false,
    })
    const [Error, setError] = useState<any>({
        wallet: null,
        users: null,
        transactions: null,
        transfer: null,
        withdraw: null,
        getCards: null,
        createCard: null,
        changeCardStatus: null
    })
    // dialog steps
    const [steps, setSteps] = useState<any>({
        dialog: 1
    })


    useEffect(() => {
        if (localStorage.getItem(PAYRILL_STORAGE_NAME) !== null) {
            const info = JSON.parse(localStorage.getItem(PAYRILL_STORAGE_NAME)!)
            setUser(info)
        }
    }, [])

    useEffect(()=>{
        getUsersWalletInfo()
    }, [])

    const isAuthenticated = isLoggedIn()


    const logout = () => {
        localStorage.clear()
        window.location.href = "/auth"
    }

    function clearPin(e: any){
        let {labelPin } = pin;
        labelPin.substring(0, labelPin.length-1)
        const newLabel = labelPin.replace(/\d/gi, "-")
        setPin((prev: any)=> ({...prev, ["originalPin"]: "", ["copyPin"]: "", ["labelPin"]: newLabel}))
    }
    
    function clearStep(stepName: string, value: number){
        setSteps((prev: any)=>({...prev, [stepName]: value}))
    }

    // get user wallet info on every re-rendered of component
    async function getUsersWalletInfo(){
        try {

            const info = JSON.parse(localStorage.getItem(PAYRILL_STORAGE_NAME)!)
        
            setLoader((prev: any)=>({...prev, wallet: true}))
            const url = APIROUTES.getWalletInfo.replace(":id", info.id);

            const {res, data} = await Fetch(url, {
              method: "POST"
            });
            setLoader((prev: any)=>({...prev, wallet: false}))
      
            if(!data.success){
              setError((prev: any)=>({...prev, wallet: data.message}))
              console.log("Error fetching wallet: " + data.message)
              return
            }

            setWalletInfo(data.data);
          } catch (e: any) {
            setLoader((prev: any)=>({...prev, wallet: false}))
            console.log("Error fetching wallet: "+ e.message)
          }
    }

    // get virtual cards
    async function getVirtualCards(){
        try {
            
        setLoader((prev: any)=>({...prev, getCards: true}))
        const url = APIROUTES.getUserCards;
        const {res, data} = await Fetch(url, {
            method: "GET"
        });
        setLoader((prev: any)=>({...prev, getCards: false}))

        if(!data.success){
            setError((prev: any)=>({...prev, getCards: data.error}))
            return
        }

        setData((prev: any)=>({...prev,cards: data.data }))
        setError((prev: any)=>({...prev, getCards: null}))

        } catch (e: any) {
            setLoader((prev: any)=>({...prev, getCards: false}))
            setError((prev: any)=>({...prev, getCards: `Something went wrong. Try again`}))
            return
        }
    }

    const ProviderParams  = {
        logout ,
        pin,
        isAuthenticated,
        user,
        Data, 
        Loader,
        Error,
        steps,
        walletInfo,
        setSteps,
        clearStep,
        setError,
        setLoader,
        setPin,
        clearPin,
        setData,
        getVirtualCards
    }

    return (
        <DataContext.Provider value={ProviderParams}>
            {children}
        </DataContext.Provider>
    )
}

function isLoggedIn() {

    const authToken = localStorage.getItem(PAYRILL_AUTHTOKEN_NAME)
    if (authToken === null) {
        return false;
    }

    const token = JSON.parse(authToken);

    if (!token) {
        return false
    }

    try {
        // exp gives us date in miliseconds
        let { exp } : any = jwtDecode(token);

        // convert milliseconds -> seconds
        let date = new Date().getTime() / 1000;
        // check if exp date is < the present date
        if (exp < date) {
            return false;
        }
    } catch (e) {
        return false;
    }

    return true;

}