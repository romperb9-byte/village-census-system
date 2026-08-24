import React, { useState } from 'react';
import { X, KeyRound, ShieldCheck, UserCheck, Phone, Target, Lock } from 'lucide-react';
import { Enumerator } from '../types';

interface UserSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  enumerators: Enumerator[];
  activeUser: Enumerator;
  onSelectUser: (user: Enumerator) => void;
}

export const UserSelectorModal: React.FC<UserSelectorModalProps> = ({
  isOpen,
  onClose,
  enumerators,
  activeUser,
  onSelectUser,
}) => {
  const [selectedEnum, setSelectedEnum] = useState<Enumerator | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSelect = (enumItem: Enumerator) => {
    setSelectedEnum(enumItem);
    setPinInput('');
    setErrorMsg('');
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnum) return;

    if (pinInput.trim() === selectedEnum.pin || selectedEnum.pin === '1234') {
      onSelectUser(selectedEnum);
      setSelectedEnum(null);
      onClose();
    } else {
      setErrorMsg(`លេខកូដ PIN មិនត្រឹមត្រូវទេ (សាកល្បង PIN ដើម: ${selectedEnum.pin})`);
    }
  };

  const handleQuickSwitch = (enumItem: Enumerator) => {
    onSelectUser(enumItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                ជ្រើសរើសគណនីប្រើប្រាស់ (ក្រុមការងារ ១២ នាក់)
              </h2>
              <p className="text-xs text-slate-500">
                សូមជ្រើសរើសគណនីរបស់លោកអ្នកដើម្បីកត់ត្រាទិន្នន័យជំរឿន
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {selectedEnum ? (
            /* PIN Confirmation Screen */
            <div className="max-w-md mx-auto py-4 text-center space-y-4">
              <div className={`w-16 h-16 rounded-full ${selectedEnum.avatarColor} text-white flex items-center justify-center mx-auto text-xl font-bold shadow-lg`}>
                {selectedEnum.name.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedEnum.khmerName}</h3>
                <p className="text-xs text-slate-500 font-medium">{selectedEnum.roleKhmer} · {selectedEnum.groupAssigned}</p>
              </div>

              <form onSubmit={handleConfirmPin} className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-center gap-2 text-slate-700 text-sm font-semibold">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>វាយបញ្ចូលលេខកូដសម្ងាត់ PIN (៤ ខ្ទង់)</span>
                </div>

                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder={`PIN (Default: ${selectedEnum.pin})`}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full text-center text-2xl tracking-widest font-mono py-2.5 px-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />

                {errorMsg && (
                  <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEnum(null)}
                    className="w-1/2 py-2 px-3 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                  >
                    ត្រឡប់ក្រោយ
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 px-3 text-xs sm:text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
                  >
                    ចូលប្រើប្រាស់
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  * ជំនួយ: លេខកូដ PIN ដើមរបស់គណនីនេះគឺ <span className="font-bold text-slate-600">{selectedEnum.pin}</span>
                </p>
              </form>
            </div>
          ) : (
            /* Enumerators Grid (12 items) */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {enumerators.map((enumItem) => {
                const isActive = activeUser.id === enumItem.id;
                return (
                  <div
                    key={enumItem.id}
                    onClick={() => handleSelect(enumItem)}
                    className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex items-center space-x-3 text-left ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-xl ${enumItem.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0`}>
                      {enumItem.name.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                          {enumItem.khmerName}
                        </h4>
                        {isActive && (
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" /> កំពុងប្រើ
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-700 font-medium truncate mt-0.5">
                        {enumItem.roleKhmer}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-slate-400" />
                          {enumItem.groupAssigned}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {enumItem.phone}
                        </span>
                      </div>
                    </div>

                    {/* Quick switch action on hover */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickSwitch(enumItem);
                      }}
                      title="ប្តូរភ្លាមៗ"
                      className="hidden group-hover:flex items-center justify-center p-1.5 bg-slate-200 hover:bg-emerald-600 hover:text-white rounded-lg text-slate-600 text-xs transition-colors"
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>សមាជិកសរុប: <strong>{enumerators.length} នាក់</strong></span>
          <span className="text-[11px]">អ្នកស្រង់ទិន្នន័យម្នាក់ៗទទួលខុសត្រូវតាមក្រុមនីមួយៗ</span>
        </div>

      </div>
    </div>
  );
};
