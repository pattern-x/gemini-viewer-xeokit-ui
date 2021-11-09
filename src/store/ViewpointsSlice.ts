import { createSlice, PayloadAction } from '@reduxjs/toolkit'
// import type { RootState } from './store'

// Define a type for the slice state
interface ViewpointsState {
  value: boolean
}

// Define the initial state using that type
const initialState: ViewpointsState = {
  value: false
}

export const viewpointsSlice = createSlice({
  name: 'viewpoints',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    setVisibility: (state, action: PayloadAction<boolean>) => {
      state.value = action.payload
    }
  }
})

export const { setVisibility } = viewpointsSlice.actions
export default viewpointsSlice.reducer