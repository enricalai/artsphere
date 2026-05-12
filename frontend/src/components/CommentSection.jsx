import React, { useState, useEffect } from 'react';
import { getComments, addComment, deleteComment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';

function CommentSection({ artworkId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [replyContent, setReplyContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        loadComments();
    }, [artworkId]);

    const loadComments = async () => {
        try {
            const response = await getComments(artworkId);
            setComments(response.data);
        } catch (err) {
            console.error('Erreur chargement commentaires:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            await addComment(artworkId, newComment);
            setNewComment('');
            await loadComments();
        } catch (err) {
            console.error('Erreur ajout commentaire:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (e, parentId) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        setSubmitting(true);
        try {
            await addComment(artworkId, replyContent, parentId);
            setReplyContent('');
            setReplyingTo(null);
            await loadComments();
        } catch (err) {
            console.error('Erreur ajout réponse:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (commentId) => {
        setDeleteTarget(commentId);
    };

    const confirmDelete = async () => {
        try {
            await deleteComment(deleteTarget);
            await loadComments();
        } catch (err) {
            console.error('Erreur suppression:', err);
        } finally {
            setDeleteTarget(null);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Fonction pour trouver le nom du commentaire parent
    const getParentName = (parentId, commentsMap) => {
        if (commentsMap[parentId]) {
            return commentsMap[parentId].user_name;
        }
        return null;
    };

    // Rendu récursif d'un commentaire et ses réponses
    const renderComment = (comment, commentsMap, depth = 0) => {
        const isReply = depth > 0;
        const maxDepth = 3; // Profondeur maximale pour éviter une indentation trop importante
        
        return (
            <div key={comment.id} className={`${isReply ? 'mt-3' : 'mt-6 first:mt-0'}`}>
                {/* Commentaire parent ou réponse */}
                <div className={`${isReply ? 'ml-6 md:ml-12 border-l-2 border-prusse/20 pl-4' : ''}`}>
                    <div className={`${!isReply ? 'bg-anthracite/5 p-4 rounded-lg' : ''}`}>
                        <div className="flex justify-between items-start flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-sans font-medium ${isReply ? 'text-prusse text-sm' : 'text-anthracite'}`}>
                                    {comment.user_name}
                                </span>
                                {isReply && (
                                    <span className="font-sans text-xs text-anthracite/50">
                                        ↳ réponse à {getParentName(comment.parent_id, commentsMap)}
                                    </span>
                                )}
                                <span className="font-sans text-xs text-anthracite/40">
                                    {formatDate(comment.created_at)}
                                </span>
                            </div>
                            {(user?.id === comment.user_id || user?.role === 'admin') && (
                                <button
                                    onClick={() => handleDeleteClick(comment.id)}
                                    className="font-sans text-xs text-anthracite/40 hover:text-red-500 transition-colors"
                                >
                                    Supprimer
                                </button>
                            )}
                        </div>
                        
                        <p className={`font-sans leading-relaxed mt-2 ${isReply ? 'text-anthracite/70 text-sm' : 'text-anthracite/80'}`}>
                            {comment.content}
                        </p>
                        
                        {/* Bouton Répondre */}
                        {user && depth < maxDepth && (
                            <button
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="text-xs text-anthracite/50 hover:text-prusse mt-3 transition-colors inline-flex items-center gap-1"
                            >
                                {replyingTo === comment.id ? '✕ Annuler' : '↩️ Répondre'}
                            </button>
                        )}
                        
                        {/* Formulaire de réponse */}
                        {replyingTo === comment.id && (
                            <form onSubmit={(e) => handleReply(e, comment.id)} className="mt-3">
                                <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder={`Répondre à ${comment.user_name}...`}
                                    rows="2"
                                    className="w-full px-3 py-2 text-sm bg-anthracite/5 border border-anthracite/20 focus:border-prusse outline-none font-sans text-anthracite rounded-lg resize-none"
                                />
                                <div className="flex gap-3 mt-2">
                                    <button 
                                        type="submit" 
                                        className="text-xs bg-prusse text-creme px-3 py-1 hover:bg-prusse/90 transition-colors rounded"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Envoi...' : 'Répondre'}
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setReplyingTo(null)} 
                                        className="text-xs text-anthracite/50 hover:text-anthracite"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
                
                {/* Afficher les réponses récursivement avec indentation */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className={`${isReply ? 'ml-6 md:ml-12' : 'ml-0 md:ml-4'}`}>
                        {comment.replies.map(reply => renderComment(reply, commentsMap, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Créer une map des commentaires pour accéder facilement aux parents
    const createCommentsMap = (commentsList) => {
        const map = {};
        const flatten = (items) => {
            items.forEach(item => {
                map[item.id] = item;
                if (item.replies && item.replies.length) {
                    flatten(item.replies);
                }
            });
        };
        flatten(commentsList);
        return map;
    };

    if (loading) {
        return (
            <div className="mt-8 border-t border-anthracite/10 pt-6">
                <p className="font-sans text-anthracite/60 text-center py-8">
                    Chargement des commentaires...
                </p>
            </div>
        );
    }

    const commentsMap = createCommentsMap(comments);

    return (
        <div className="mt-8 border-t border-anthracite/10 pt-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl text-anthracite">
                    Commentaires
                </h2>
                <span className="font-sans text-sm text-anthracite/50 bg-anthracite/5 px-3 py-1 rounded-full">
                    {comments.length} {comments.length === 1 ? 'réaction' : 'réactions'}
                </span>
            </div>

            {/* Formulaire d'ajout de commentaire principal */}
            {user ? (
                <form onSubmit={handleSubmit} className="mb-8">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Partagez votre ressenti sur cette œuvre..."
                        rows="3"
                        className="w-full px-4 py-3 bg-anthracite/5 border border-anthracite/20 focus:border-prusse outline-none font-sans text-anthracite rounded-lg resize-none transition-colors"
                    />
                    <div className="flex justify-end mt-3">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={submitting || !newComment.trim()}
                        >
                            {submitting ? 'Publication...' : 'Publier le commentaire'}
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="mb-8 p-4 bg-anthracite/5 text-center rounded-lg">
                    <p className="font-sans text-anthracite/60">
                        <a href="/login" className="text-prusse hover:underline">Connectez-vous</a> pour laisser un commentaire
                    </p>
                </div>
            )}

            {/* Liste des commentaires avec réponses */}
            {comments.length === 0 ? (
                <div className="text-center py-12">
                    <p className="font-sans text-anthracite/40">
                        Aucun commentaire pour le moment.
                    </p>
                    <p className="font-sans text-anthracite/40 text-sm mt-1">
                        Soyez le premier à réagir !
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {comments.map(comment => renderComment(comment, commentsMap, 0))}
                </div>
            )}

            {/* Modal de confirmation de suppression */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-creme max-w-md mx-4 p-6 rounded-sm shadow-xl">
                        <h3 className="font-serif text-xl text-anthracite mb-2">Supprimer le commentaire</h3>
                        <p className="font-sans text-anthracite/70 mb-4">
                            Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setDeleteTarget(null)} 
                                className="px-4 py-2 font-sans text-sm text-anthracite/60 hover:text-anthracite transition-colors"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                className="bg-red-500 text-white px-4 py-2 font-sans text-sm hover:bg-red-600 transition-colors rounded-sm"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CommentSection;