import { createContext, useReducer, useEffect, useCallback } from 'react'
import axios from 'axios'

export const AuthContext = createContext()

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000'

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: true,
}

export const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload.user, accessToken: action.payload.accessToken, isAuthenticated: true, loading: false }
    case 'LOGOUT':
      return { ...initialState, loading: false }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } }
    default:
      return state
  }
}

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const setUser = useCallback((userData, token) => {
    dispatch({ type: 'SET_USER', payload: { user: userData, accessToken: token } })
  }, [])

  const logout = useCallback(async () => {
    try {
      if (state.accessToken) {
        await axios.post(`${API_URL}/api/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${state.accessToken}` },
          withCredentials: true,
        })
      }
    } catch (err) {
      // ignore
    }
    dispatch({ type: 'LOGOUT' })
  }, [state.accessToken])

  const refreshAccessToken = useCallback(async () => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true })
      return res.data.accessToken
    } catch (err) {
      dispatch({ type: 'LOGOUT' })
      return null
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      const token = new URLSearchParams(window.location.search).get('token')
      if (token) {
        try {
          const res = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          })
          setUser(res.data.user, token)
          window.history.replaceState({}, document.title, window.location.pathname)
          return
        } catch (err) {
          // ignore
        }
      }
      try {
        const res = await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true })
        const newToken = res.data.accessToken
        const userRes = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${newToken}` },
          withCredentials: true,
        })
        setUser(userRes.data.user, newToken)
      } catch (err) {
        dispatch({ type: 'LOGOUT' })
      }
    }
    initAuth()
  }, [setUser])

  const axiosInstance = axios.create({ baseURL: API_URL })
  axiosInstance.interceptors.request.use((config) => {
    if (state.accessToken) {
      config.headers.Authorization = `Bearer ${state.accessToken}`
    }
    config.withCredentials = true
    return config
  })

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
        originalRequest._retry = true
        const newToken = await refreshAccessToken()
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return axiosInstance(originalRequest)
        }
      }
      return Promise.reject(error)
    }
  )

  return (
    <AuthContext.Provider value={{ ...state, dispatch, setUser, logout, refreshAccessToken, axiosInstance, API_URL }}>
      {children}
    </AuthContext.Provider>
  )
}
