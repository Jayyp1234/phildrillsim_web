import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    data:{}
}
const wellDataSlice = createSlice({
    name:"wellDataSlice",
    initialState,
    reducers:{
        setWellPlanData:(state,actions)=>{
            state.data = actions.payload
        }
    }
})

export const {setWellPlanData} = wellDataSlice.actions
export default wellDataSlice.reducer