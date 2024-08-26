import {configureStore} from '@reduxjs/toolkit'
import wellDataSlice from './wellDataSlice'

const store = configureStore({
    reducer:{
        wellPlanManager:wellDataSlice
    }
})

export default store