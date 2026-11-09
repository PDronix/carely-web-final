function isActiveFamilyManager(person, managerPerson, userId) {
  return Boolean(person && person.person_type === 'dependent' && person.family_id != null
    && managerPerson && managerPerson.status === 'active' && managerPerson.person_type === 'member'
    && managerPerson.family_id != null && Number(managerPerson.family_id) === Number(person.family_id)
    && Number(person.manager_user_id) === Number(userId)
    && Number(managerPerson.user_id) === Number(userId));
}

module.exports = { isActiveFamilyManager };
