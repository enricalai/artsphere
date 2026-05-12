import React, { useState } from 'react';
import { searchUsersPublic } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import { Link } from 'react-router-dom';

function SearchUsersPublic() {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    if (!user) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-12 text-center">
                <p className="text-anthracite/60">🔒 Connectez-vous pour rechercher d'autres artistes.</p>
            </div>
        );
    }

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim() || query.length < 2) return;

        setLoading(true);
        setSearched(true);
        try {
            const res = await searchUsersPublic(query);
            setResults(res.data);
        } catch (err) {
            console.error(err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="font-serif text-3xl text-anthracite mb-2">Rechercher un artiste</h1>
            <p className="text-anthracite/60 mb-6">Trouvez d'autres membres par nom, email, ville ou pays.</p>

            <form onSubmit={handleSearch} className="mb-8 flex gap-2">
                <input
                    type="text"
                    placeholder="Nom, ville, pays…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 px-4 py-2 border border-anthracite/20 focus:border-prusse outline-none bg-transparent"
                />
                <button className="bg-prusse text-white px-6 py-2 hover:bg-prusse/80">
                    Rechercher
                </button>
            </form>

            {loading && <p className="text-anthracite/60">Recherche…</p>}
            {searched && !loading && results.length === 0 && (
                <p className="text-anthracite/50">Aucun utilisateur trouvé.</p>
            )}

            {results.length > 0 && (
                <div className="space-y-4">
                    {results.map((u) => (
                        <Link 
                            key={u.id} 
                            to={`/user/${u.id}`} 
                            className="border border-anthracite/10 p-4 flex items-center gap-4 hover:bg-anthracite/5 transition"
                        >
                            <Avatar src={u.avatar_url} alt={u.nom} size="md" />
                            <div>
                                <p className="font-serif text-lg text-anthracite">{u.nom}</p>
                                <p className="text-sm text-anthracite/60">{u.email}</p>
                                <p className="text-xs text-anthracite/50">{u.ville && `${u.ville}, `}{u.pays || ''}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SearchUsersPublic;