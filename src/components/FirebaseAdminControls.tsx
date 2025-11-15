'use client';

import { useState } from 'react';

interface Market {
    polymarket_id: string;
    question: string;
    yes_price: number;
    no_price: number;
    volume: number;
    category: string;
    active: boolean;
    resolved: boolean;
}

interface FirebaseAdminControlsProps {
    markets: Market[];
    onMarketUpdate?: (marketId: string, updates: Partial<Market>) => void;
}

export default function FirebaseAdminControls({ markets, onMarketUpdate }: FirebaseAdminControlsProps) {
    const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
    const [editForm, setEditForm] = useState<Partial<Market>>({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleEditMarket = (market: Market) => {
        setSelectedMarket(market);
        setEditForm({
            question: market.question,
            yes_price: market.yes_price,
            no_price: market.no_price,
            volume: market.volume,
            category: market.category,
            active: market.active,
            resolved: market.resolved
        });
    };

    const handleSaveChanges = async () => {
        if (!selectedMarket) return;

        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`/api/firebase/markets/${selectedMarket.polymarket_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editForm),
            });

            const result = await response.json();

            if (result.success) {
                setMessage(`✅ Market updated successfully!`);
                onMarketUpdate?.(selectedMarket.polymarket_id, editForm);
                setSelectedMarket(null);
                setEditForm({});
            } else {
                setMessage(`❌ Failed to update market: ${result.error}`);
            }
        } catch (error) {
            setMessage(`❌ Error updating market: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMarket = async (marketId: string) => {
        if (!confirm('Are you sure you want to delete this market?')) return;

        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch(`/api/firebase/markets/${marketId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                setMessage(`✅ Market deleted successfully!`);
            } else {
                setMessage(`❌ Failed to delete market: ${result.error}`);
            }
        } catch (error) {
            setMessage(`❌ Error deleting market: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border-1 border-gray p-4" style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
            <div className="text-white font-bold mb-4 text-base flex items-center gap-2">
                🔥 FIREBASE_ADMIN_CONTROLS
            </div>

            {message && (
                <div className={`mb-4 p-2 border-2 ${message.startsWith('✅') ? 'border-gray-500' : 'border-red-500'}`}>
                    <div className="text-xs font-bold">{message}</div>
                </div>
            )}

            <div className="space-y-4">
                {/* Market List */}
                <div>
                    <label className="block text-xs font-bold mb-2">SELECT MARKET TO EDIT:</label>
                    <div className="max-h-40 overflow-y-auto border-2 border-gray">
                        {markets.slice(0, 10).map((market) => (
                            <div
                                key={market.polymarket_id}
                                className="p-2 border-b border-gray-300 cursor-pointer"
                                onClick={() => handleEditMarket(market)}
                            >
                                <div className="text-xs font-bold truncate">{market.question}</div>
                                <div className="text-xs text-white-600">
                                    YES: {Math.round(market.yes_price * 100)}¢ | Volume: ${market.volume.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Edit Form */}
                {selectedMarket && (
                    <div className="border-2 border-gray p-3">
                        <div className="text-xs font-bold mb-3">
                            EDITING: {selectedMarket.question}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <label className="block font-bold mb-1">YES PRICE:</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={editForm.yes_price || 0}
                                    onChange={(e) => setEditForm({ ...editForm, yes_price: parseFloat(e.target.value) })}
                                    className="w-full border border-gray px-2 py-1"
                                />
                            </div>

                            <div>
                                <label className="block font-bold mb-1">NO PRICE:</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={editForm.no_price || 0}
                                    onChange={(e) => setEditForm({ ...editForm, no_price: parseFloat(e.target.value) })}
                                    className="w-full border border-gray px-2 py-1"
                                />
                            </div>

                            <div>
                                <label className="block font-bold mb-1">VOLUME:</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editForm.volume || 0}
                                    onChange={(e) => setEditForm({ ...editForm, volume: parseFloat(e.target.value) })}
                                    className="w-full border border-gray px-2 py-1"
                                />
                            </div>

                            <div>
                                <label className="block font-bold mb-1">CATEGORY:</label>
                                <input
                                    type="text"
                                    value={editForm.category || ''}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    className="w-full border border-gray px-2 py-1"
                                />
                            </div>

                            <div>
                                <label className="flex items-center font-bold">
                                    <input
                                        type="checkbox"
                                        checked={editForm.active || false}
                                        onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                                        className="mr-2"
                                    />
                                    ACTIVE
                                </label>
                            </div>

                            <div>
                                <label className="flex items-center font-bold">
                                    <input
                                        type="checkbox"
                                        checked={editForm.resolved || false}
                                        onChange={(e) => setEditForm({ ...editForm, resolved: e.target.checked })}
                                        className="mr-2"
                                    />
                                    RESOLVED
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold mb-1">QUESTION:</label>
                            <textarea
                                value={editForm.question || ''}
                                onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                                className="w-full border border-gray px-2 py-1 text-xs"
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleSaveChanges}
                                disabled={loading}
                                className="border-2 border-gray px-3 py-1 font-bold text-xs disabled:opacity-50"
                            >
                                {loading ? 'SAVING...' : 'SAVE_CHANGES'}
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedMarket(null);
                                    setEditForm({});
                                }}
                                className="border-2 border-gray px-3 py-1 font-bold text-xs"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={() => handleDeleteMarket(selectedMarket.polymarket_id)}
                                disabled={loading}
                                className="border-2 border-gray px-3 py-1 font-bold text-xs disabled:opacity-50"
                            >
                                DELETE
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}