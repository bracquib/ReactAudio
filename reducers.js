// reducers.js
const initialState = {
  token: null,
  isAdmin: false, // Ajouter le statut isAdmin à l'état initial
};

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_TOKEN':
      return { ...state, token: action.token };
    case 'SET_IS_ADMIN':
      return { ...state, isAdmin: action.isAdmin }; // Ajouter le cas pour définir le statut isAdmin
    default:
      return state;
  }
};

export default rootReducer;
