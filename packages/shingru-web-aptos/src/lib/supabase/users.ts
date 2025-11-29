import { supabase } from './client';

export interface User {
  id: string;
  username: string | null;
  wallet_address: string;
  chain: string;
  profile_image_type?: string;
  profile_image_data?: any;
  created_at: string;
  updated_at: string;
}

/**
 * Check if a username is available
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (error) {
      // If there's an error other than "not found", log it but don't fail
      if (error.code !== 'PGRST116') {
        console.error('Error checking username:', error);
        return false;
      }
    }

    // If data exists, username is taken
    return !data;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
}

/**
 * Create a new user
 */
export async function createUser(data: {
  username?: string | null;
  wallet_address: string;
  chain: string;
  profile_image_type?: string;
  profile_image_data?: any;
}): Promise<User | null> {
  try {
    // Normalize wallet address to lowercase for Aptos
    const insertData: any = {
      wallet_address: data.wallet_address.toLowerCase(),
      chain: data.chain,
    };

    // Only add username if provided
    if (data.username) {
      insertData.username = data.username.toLowerCase();
    }

    // Only add profile image if provided
    if (data.profile_image_type) {
      insertData.profile_image_type = data.profile_image_type;
    }
    if (data.profile_image_data) {
      insertData.profile_image_data = data.profile_image_data;
    }

    console.log('Inserting user data:', insertData);
    
    const { data: user, error } = await supabase
      .from('users')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

/**
 * Get user by wallet address
 */
export async function getUserByWallet(walletAddress: string, chain: string): Promise<User | null> {
  try {
    // Normalize wallet address to lowercase for Aptos
    const normalizedAddress = walletAddress.toLowerCase();
    console.log('Getting user by wallet:', { walletAddress: normalizedAddress, chain });
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', normalizedAddress)
      .eq('chain', chain)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - this is expected
        console.log('User not found (expected for new users)');
        return null;
      }
      console.error('Error getting user:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error getting user by username:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
}

/**
 * Update user username
 */
export async function updateUsername(
  userId: string,
  username: string
): Promise<User | null> {
  try {
    console.log('Updating username for user:', userId, 'to:', username);
    
    const { data, error } = await supabase
      .from('users')
      .update({
        username: username.toLowerCase(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating username:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return null;
    }

    console.log('Username updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating username:', error);
    return null;
  }
}

/**
 * Update user username by wallet address (for backend-less mode)
 * If user doesn't exist, creates a new user with the username
 */
export async function updateUsernameByWallet(
  walletAddress: string,
  chain: string,
  username: string
): Promise<User | null> {
  try {
    const normalizedAddress = walletAddress.toLowerCase();
    console.log('Updating username by wallet:', normalizedAddress, 'to:', username);
    
    // First, try to get the user
    const existingUser = await getUserByWallet(walletAddress, chain);
    
    if (existingUser) {
      // User exists, update username
      const { data, error } = await supabase
        .from('users')
        .update({
          username: username.toLowerCase(),
          updated_at: new Date().toISOString(),
        })
        .eq('wallet_address', normalizedAddress)
        .eq('chain', chain)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating username by wallet:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        return null;
      }

      console.log('Username updated successfully:', data);
      return data;
    } else {
      // User doesn't exist, create new user with username
      console.log('User not found, creating new user with username:', username);
      const newUser = await createUser({
        wallet_address: walletAddress,
        chain: chain,
        username: username,
      });
      
      if (!newUser) {
        console.error('Failed to create user with username');
        return null;
      }
      
      console.log('User created successfully with username:', newUser);
      return newUser;
    }
  } catch (error) {
    console.error('Error updating username by wallet:', error);
    return null;
  }
}

/**
 * Update user profile image
 */
export async function updateProfileImage(
  userId: string,
  profileImageType: string,
  profileImageData: any
): Promise<User | null> {
  try {
    console.log('updateProfileImage called with:', {
      userId,
      profileImageType,
      profileImageData,
    });

    // First, check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    console.log('User existence check:', { existingUser, checkError });

    if (checkError) {
      console.error('Error checking user existence:', checkError);
    }

    if (!existingUser) {
      console.error('User not found with ID:', userId);
      return null;
    }

    // First, update without select to avoid 406 errors
    const { data: updateData, error: updateError, count } = await supabase
      .from('users')
      .update({
        profile_image_type: profileImageType,
        profile_image_data: profileImageData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id'); // Select only id to check if update was successful

    console.log('Update result:', { updateData, updateError, count });

    if (updateError) {
      console.error('Error updating profile image:', updateError);
      console.error('Error details:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
      });
      console.error('⚠️ This error usually means RLS policies are blocking the update.');
      console.error('⚠️ Please run the migration: supabase-migrations/fix_users_rls_policies.sql');
      return null;
    }

    // Check if any rows were updated
    if (!updateData || updateData.length === 0) {
      console.error('No rows were updated. This usually means RLS policy is blocking the update.');
      console.error('⚠️ Please run the migration: supabase-migrations/fix_users_rls_policies.sql');
      console.error('⚠️ The migration should create a policy that allows UPDATE with USING (true) and WITH CHECK (true)');
      return null;
    }

    // Then, fetch the updated user separately
    const { data, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    console.log('Select result:', { data, selectError });

    if (selectError) {
      console.error('Error fetching updated user:', selectError);
      console.error('Error details:', {
        message: selectError.message,
        code: selectError.code,
        details: selectError.details,
        hint: selectError.hint,
      });
      return null;
    }

    if (!data) {
      console.warn('User not found after update. This might be an RLS policy issue.');
      return null;
    }

    console.log('Profile image updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating profile image:', error);
    return null;
  }
}

