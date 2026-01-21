/**
 * Firestore Connection Test Utility
 * 
 * This utility provides functions to test Firestore database connectivity.
 * Use this to verify that Firestore is properly configured and accessible.
 */

import { db } from './config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

/**
 * Test basic Firestore connection by attempting to read from a collection
 * @param collectionName - Name of the collection to test (default: 'test')
 * @returns Promise<boolean> - true if connection is successful, false otherwise
 */
export async function testFirestoreConnection(
  collectionName: string = 'test'
): Promise<boolean> {
  try {
    // Attempt to read from a test collection
    // This will fail if Firestore is not properly configured
    const testCollection = collection(db, collectionName);
    await getDocs(testCollection);
    return true;
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    return false;
  }
}

/**
 * Test Firestore connection by checking if a specific document exists
 * @param collectionName - Name of the collection
 * @param documentId - ID of the document to check
 * @returns Promise<boolean> - true if document exists or connection is successful, false otherwise
 */
export async function testFirestoreDocumentAccess(
  collectionName: string,
  documentId: string
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await getDoc(docRef);
    return true;
  } catch (error) {
    console.error('Firestore document access test failed:', error);
    return false;
  }
}

/**
 * Verify that Firestore database instance is properly initialized
 * @returns boolean - true if db instance exists, false otherwise
 */
export function verifyFirestoreInitialization(): boolean {
  try {
    return db !== null && db !== undefined;
  } catch (error) {
    console.error('Firestore initialization verification failed:', error);
    return false;
  }
}
