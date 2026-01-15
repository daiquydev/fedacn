import http from '../utils/http'

// MongoDB Recipes API for regular users
export const getCategoryRecipes = () => http.get('/recipes/category/get-category')
export const createRecipe = (body) =>
	http.post('/recipes/user/create', body, {
		headers: {
			'Content-Type': 'multipart/form-data'
		}
	})
export const getMyRecipes = (params) => http.get('/recipes/user/my-recipes', { params })
export const updateMyRecipe = (id, body) => {
	const config = body instanceof FormData
		? {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			}
		: undefined
	return http.put(`/recipes/user/update/${id}`, body, config)
}
export const deleteMyRecipe = (id) => http.delete(`/recipes/user/delete/${id}`)

// Get recipes for viewing
export const getRecipesForUser = (params) => http.get('/recipes/user/get-recipes', { params })
export const getRecipeForUser = (id) => http.get(`/recipes/user/get-recipe/${id}`)
export const getTopRecipes = () => http.get('/recipes/user/get-top-recipes')
export const getUserRecipe = (userId, params) => http.get(`/recipes/user/get-list-recipe/${userId}`, { params })

// Chef endpoints (keeping these for compatibility)
export const getRecipesForChef = (params) => http.get('/recipes/chef/get-recipes', { params })
export const getRecipeForChef = (id) => http.get(`/recipes/chef/get-recipe/${id}`)
export const updateRecipeForChef = (id, body) => {
	const config = body instanceof FormData
		? {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			}
		: undefined
	return http.put(`/recipes/chef/update-recipe/${id}`, body, config)
}
export const deleteRecipeForChef = (id) => http.delete(`/recipes/chef/delete-recipe/${id}`)

// Recipe interactions
export const likeRecipe = (body) => http.post('/recipes/actions/like', body)
export const unlikeRecipe = (body) => http.post('/recipes/actions/unlike', body)
export const bookmarkRecipe = (body) => http.post('/recipes/actions/bookmark', body)
export const unbookmarkRecipe = (body) => http.post('/recipes/actions/unbookmark', body)

// Comments
export const createCommentRecipe = (body) => http.post('/recipes/actions/comment', body)
export const getCommentRecipe = (params) => http.get('/recipes/actions/comment', { params })
export const deleteCommentRecipe = (body) => http.post('/recipes/actions/delete-comment', body)

// Lowdb Recipes API (keeping for backward compatibility)
export const searchRecipes = (params) => http.get('/lowdb-recipes/search', { params })
export const getFeaturedRecipes = () => http.get('/lowdb-recipes/featured')
export const getRecipesByCategory = (category, params) => http.get(`/lowdb-recipes/category/${category}`, { params })
export const calculateNutrition = (ingredients) => http.post('/lowdb-recipes/calculate-nutrition', { ingredients })
