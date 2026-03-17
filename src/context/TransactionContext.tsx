import React, {
  createContext, useContext, useReducer, ReactNode,
} from 'react';
import { Transaction, TransactionStatus } from '../types';

interface TransactionState {
  active:  Transaction[];
  history: Transaction[];
}

type Action =
  | { type: 'SET_ALL';       active: Transaction[]; history: Transaction[] }
  | { type: 'ADD';           transaction: Transaction }
  | { type: 'UPDATE_STATUS'; id: string; status: TransactionStatus; extra?: Partial<Transaction> }
  | { type: 'CONFIRM_BUYER'; id: string }
  | { type: 'CONFIRM_SELLER'; id: string };

function reducer(state: TransactionState, action: Action): TransactionState {
  switch (action.type) {
    case 'SET_ALL':
      return { active: action.active, history: action.history };

    case 'ADD':
      return { ...state, active: [action.transaction, ...state.active] };

    case 'UPDATE_STATUS': {
      const update = (list: Transaction[]) =>
        list.map(t =>
          t.id === action.id
            ? { ...t, status: action.status, ...action.extra }
            : t,
        );
      const updated = update(state.active);
      const completed = updated.filter(
        t => t.status === 'completed' || t.status === 'cancelled',
      );
      const stillActive = updated.filter(
        t => t.status !== 'completed' && t.status !== 'cancelled',
      );
      return {
        active:  stillActive,
        history: [...completed, ...state.history],
      };
    }

    case 'CONFIRM_BUYER': {
      const update = (list: Transaction[]) =>
        list.map(t => (t.id === action.id ? { ...t, buyerConfirmed: true } : t));
      return { ...state, active: update(state.active) };
    }

    case 'CONFIRM_SELLER': {
      const update = (list: Transaction[]) =>
        list.map(t => (t.id === action.id ? { ...t, sellerConfirmed: true } : t));
      return { ...state, active: update(state.active) };
    }

    default:
      return state;
  }
}

interface TransactionContextValue {
  activeTransactions:  Transaction[];
  pastTransactions:    Transaction[];
  addTransaction:      (t: Transaction) => void;
  updateStatus:        (id: string, status: TransactionStatus, extra?: Partial<Transaction>) => void;
  confirmBuyer:        (id: string) => void;
  confirmSeller:       (id: string) => void;
  isBothConfirmed:     (id: string) => boolean;
}

const TransactionContext = createContext<TransactionContextValue>({
  activeTransactions:  [],
  pastTransactions:    [],
  addTransaction:      () => {},
  updateStatus:        () => {},
  confirmBuyer:        () => {},
  confirmSeller:       () => {},
  isBothConfirmed:     () => false,
});

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { active: [], history: [] });

  const isBothConfirmed = (id: string) => {
    const t = state.active.find(x => x.id === id);
    return !!t && t.buyerConfirmed && t.sellerConfirmed;
  };

  return (
    <TransactionContext.Provider
      value={{
        activeTransactions: state.active,
        pastTransactions:   state.history,
        addTransaction:     t => dispatch({ type: 'ADD', transaction: t }),
        updateStatus:       (id, status, extra) => dispatch({ type: 'UPDATE_STATUS', id, status, extra }),
        confirmBuyer:       id => dispatch({ type: 'CONFIRM_BUYER', id }),
        confirmSeller:      id => dispatch({ type: 'CONFIRM_SELLER', id }),
        isBothConfirmed,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  return useContext(TransactionContext);
}
